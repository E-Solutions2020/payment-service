import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { PaymentRepo } from '../repositories'
import * as Bluebird from 'bluebird'
import { ConfigService } from '../config'
import { Payment, UpdatePayment } from '../entities'
import { PayLinkClient } from '@app/pay-link-client'
import { RefundStatus } from '../enumerations'
import { createErrorMessage } from './utils'

@Injectable()
export class RefundStatusJobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RefundStatusJobService.name)
  private isJobRunning = false
 
  constructor(private readonly paymentRepo: PaymentRepo,
              private readonly config: ConfigService,
              private readonly payLinkClient: PayLinkClient,
              private readonly schedulerRegistry: SchedulerRegistry,
              private readonly configService: ConfigService) {
  }

  private async updateRefundStatuses(): Promise<void> {
    if (this.isJobRunning) {
      return
    }
    
    try {
      this.isJobRunning = true
      await this._updateRefundStatuses()
    } catch (err) {
      this.logger.error(`Error updating refund status`, err)
    } finally {
      this.isJobRunning = false
    }
  }
  
  private async _updateRefundStatuses(): Promise<void> {
    while (true) {
      const items = await this.paymentRepo.findRefunding({ size: 1000 })

      if (items.length === 0) {
        break
      }

      const start = Date.now()

      const { concurrency } = this.config.paymentStatusUpdate

      await Bluebird.map(items, v => this.updateRefundStatus(v), { concurrency })

      this.logger.log(`Updated refund status of ${items.length} payment(s) at speed ` +
        `${(1000 * items.length / (Date.now() - start)).toFixed(2)} payment/sec`)
    }
  }

  async updateRefundStatus(payment: Payment): Promise<void> {
    try {
      await this._updateRefundStatus(payment)
    } catch (err) {
      this.logger.error(`Error updating payment ${payment.id} refund status`, err)
    }
  }

  async _updateRefundStatus(payment: Payment): Promise<Payment> {
    const start = Date.now()

    this.logger.log(`Updating payment ${payment.id} refund status`)

    try {
      payment = await this.checkTransactionState(payment)
    } finally {
      await this.setPaymentStatusRetryTime(payment.id)
    }
    
    this.logger.log(`(${Date.now() - start}ms) Updated payment ${payment.id} refund status`)
    
    return payment
  }

  private async checkTransactionState(payment: Payment): Promise<Payment> {
    let state
    try {
      state = await this.payLinkClient.getTransactionState(payment.sid)
    } catch (err) {
      const updateData: UpdatePayment = {
        statusMessage: createErrorMessage(err),
      }
  
      await this.paymentRepo.update(payment.id, updateData)
  
      throw err
    }
  
    const lastOperData = state.oper_data?.at(-1)
  
    const updateData: UpdatePayment = {
      refundStatus: RefundStatus.started,
    }
    
    if (lastOperData && Number(lastOperData.REVERSED) === 1) {
      updateData.refundStatus = RefundStatus.finished
      updateData.refundAmount = Number(lastOperData.REV_AMOUNT)
      
      if (this.configService.notification.onPaymentRefund) {
        updateData.isNotified = false
        updateData.notifyStartAt = null
        updateData.notifyRetryAt = null
        updateData.notifyError = null
        updateData.notifyAttempts = 0
      }
    }
    
    payment = await this.paymentRepo.update(payment.id, updateData)
    
    return payment
  }
  
  private async setPaymentStatusRetryTime(paymentId: Payment['id']): Promise<Payment> {
    const payment = await this.paymentRepo.findById(paymentId)
    
    const updateData: UpdatePayment = {}
    
    if ([RefundStatus.failed, RefundStatus.finished].includes(payment.refundStatus)) {
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
    
    return  this.paymentRepo.update(payment.id, updateData)
  }
  
  onApplicationBootstrap() {
    this.schedulerRegistry.addInterval('update-refund-status',
      setInterval(this.updateRefundStatuses.bind(this), this.config.paymentStatusUpdate.minIntervalSeconds *  1000))
  }
}