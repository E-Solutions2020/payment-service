import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { PaymentRepo } from '../repositories'
import * as Bluebird from 'bluebird'
import { ConfigService } from '../config'
import { Payment, UpdatePayment } from '../entities'
import {
  FINISHED_POST_TRANSACTION_ACTION_STATUSES,
  PENDING_POST_TRANSACTION_ACTION_STATUSES,
  PostTransactionClient,
  PostTransactionRequest,
  PostTransactionStatus,
  PostTransactionStatusRequest,
} from '@app/post-transaction-client'
import { v4 as uuidv4 } from 'uuid'
import { createErrorMessage } from './utils'
import { AxiosError } from 'axios'

@Injectable()
export class PostTransactionStatusJobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PostTransactionStatusJobService.name)
  private isJobRunning = false

  constructor(private readonly paymentRepo: PaymentRepo,
              private readonly config: ConfigService,
              private readonly postTransactionClient: PostTransactionClient,
              private readonly schedulerRegistry: SchedulerRegistry) {
  }
  
  private async updatePaymentStatuses(): Promise<void> {
    if (this.isJobRunning) {
      return
    }
    
    try {
      this.isJobRunning = true
      await this._updatePaymentStatuses()
    } catch (err) {
      this.logger.error(`Error updating post transaction status`, err)
    } finally {
      this.isJobRunning = false
    }
  }
  
  private async _updatePaymentStatuses(): Promise<void> {
    while (true) {
      const items = await this.paymentRepo.findAbsNotFinished({ size: 1000 })

      if (items.length === 0) {
        break
      }

      const start = Date.now()

      const { concurrency } = this.config.paymentStatusUpdate

      await Bluebird.map(items, v => this.updatePaymentStatus(v), { concurrency })

      this.logger.log(`Updated post transaction status of ${items.length} payment(s) at speed ` +
        `${(1000 * items.length / (Date.now() - start)).toFixed(2)} payment/sec`)
    }
  }

  async updatePaymentStatus(payment: Payment): Promise<void> {
    try {
      await this._updatePaymentStatus(payment)
    } catch (err) {
      this.logger.error(`Error updating payment ${payment.id} post transaction status`, err)
    }
  }

  async _updatePaymentStatus(payment: Payment): Promise<void> {
    const start = Date.now()

    this.logger.log(`Updating payment ${payment.id} post transaction status`)
  
    try {
      if (!payment.absActionId) {
        payment = await this.createPostTransaction(payment)
      } else {
        payment = await this.updatePostTransactionStatus(payment)
      }
    } finally {
      await this.setPaymentStatusRetryTime(payment.id)
    }
  
    this.logger.log(`(${Date.now() - start}ms) Updated payment ${payment.id} post transaction status`)
  }
  
  private async createPostTransaction(payment: Payment): Promise<Payment> {
    let postTransactionResponse
    try {
      postTransactionResponse = await this.postTransactionClient.createPostTransaction(new PostTransactionRequest({
        refParam: uuidv4(),
        body: {
          terminalContractId: this.config.postTransactionService.terminalId,
          processingId: payment.processingId,
          tslId: payment.transactionId,
          currencyCode: payment.currency,
          amount: payment.amount,
          iban: payment.recipientIban,
          name: payment.recipientName,
          okpo: payment.recipientEdrpou,
          desc: payment.description.replace(/ #(\d)/g, ' №$1'),
        }
      }))
    } catch (err) {
      const updateData: UpdatePayment = {
        statusMessage: createErrorMessage(err),
      }
      
      if (err instanceof AxiosError && err.response?.data.code) {
        updateData.absStatus = err.response.data.code
      }
      
      await this.paymentRepo.update(payment.id, updateData)
      
      throw err
    }
    
    const { code, message, body } = postTransactionResponse
    
    const isAbsFailed = code !== PostTransactionStatus.success
    
    return this.paymentRepo.update(payment.id, {
      isAbsFailed,
      isFailed: isAbsFailed,
      isFinished: !isAbsFailed,
      absStatus: code,
      absActionId: body?.actionId,
      statusMessage: message,
      finishAbsDate: new Date(),
    })
  }
  
  private async updatePostTransactionStatus(payment: Payment): Promise<Payment> {
    let postTransactionStatusResponse
    try {
      postTransactionStatusResponse = await this.postTransactionClient.getPostTransactionState(new PostTransactionStatusRequest({
        refParam: uuidv4(),
        body: {
          actId: payment.absActionId,
        },
      }))
    } catch (err) {
      const updateData: UpdatePayment = {
        statusMessage: createErrorMessage(err),
      }
  
      if (err instanceof AxiosError && err.response?.data.code) {
        updateData.absStatus = err.response.data.code
      }
  
      await this.paymentRepo.update(payment.id, updateData)
  
      throw err
    }
    
    const { code, message, body } = postTransactionStatusResponse
    const { actionStatus: absActionStatus, actionTime: absActionTime } = body || {}
    const isAbsPending = PENDING_POST_TRANSACTION_ACTION_STATUSES.includes(absActionStatus)
    const isAbsFinished = FINISHED_POST_TRANSACTION_ACTION_STATUSES.includes(absActionStatus)
    const isAbsFailed = code !== PostTransactionStatus.success
      || (absActionStatus != null && !isAbsPending && !isAbsFinished)
    
    const updateData: UpdatePayment = {
      absStatus: code,
      absActionStatus,
      absActionTime,
      isAbsFailed,
      isAbsFinished,
      isFailed: isAbsFailed,
      isFinished: !isAbsFailed,
      statusMessage: message,
      finishAbsDate: new Date(),
    }
    
    if (isAbsFailed || isAbsFinished) {
      updateData.isNotified = false
      updateData.notifyStartAt = null
      updateData.notifyRetryAt = null
      updateData.notifyError = null
      updateData.notifyAttempts = 0
    }
    
    return this.paymentRepo.update(payment.id, updateData)
  }
  
  private async setPaymentStatusRetryTime(paymentId: Payment['id']): Promise<Payment> {
    const payment = await this.paymentRepo.findById(paymentId)
    
    const updateData: UpdatePayment = {}
    
    if (payment.isFailed || payment.isAbsFinished) {
      updateData.statusUpdateStartAt = null
      updateData.notifyRetryAt = null
      updateData.statusUpdateAttempts = 0
    } else {
      if (!updateData.statusUpdateStartAt) {
        updateData.statusUpdateStartAt = new Date()
      }
      updateData.statusUpdateAttempts = payment.statusUpdateAttempts + 1
      const statusUpdateRetryAt = new Date()
      const { minIntervalSeconds, maxIntervalSeconds } = this.config.paymentStatusUpdate
      const retryAfterSeconds = Math.min(minIntervalSeconds * 2 ** payment.statusUpdateAttempts, maxIntervalSeconds)
      statusUpdateRetryAt.setSeconds(statusUpdateRetryAt.getSeconds() + retryAfterSeconds)
      updateData.statusUpdateRetryAt = statusUpdateRetryAt
    }
    
    return this.paymentRepo.update(payment.id, updateData)
  }
  
  onApplicationBootstrap() {
    this.schedulerRegistry.addInterval('update-post-transaction-status',
      setInterval(this.updatePaymentStatuses.bind(this), this.config.paymentStatusUpdate.minIntervalSeconds *  1000))
  }
}