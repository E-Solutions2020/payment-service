import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { PanErrorRepo, PaymentRepo } from '../repositories'
import * as Bluebird from 'bluebird'
import { ConfigService } from '../config'
import { Payment, UpdatePayment } from '../entities'
import {
  FINISHED_PAY_LINK_STATUSES,
  PayLinkClient,
  PayLinkStatus,
  PENDING_PAY_LINK_STATUSES,
} from '@app/pay-link-client'
import { Observable, Subject } from 'rxjs'
import { createErrorMessage } from './utils'
import { NotificationJobService } from './notification-job.service'

@Injectable()
export class PayLinkStatusJobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PayLinkStatusJobService.name)
  private isJobRunning = false
  private subjects: Map<Payment['id'], { subject: Subject<Payment>, count: number }> = new Map()
 
  constructor(private readonly paymentRepo: PaymentRepo,
              private readonly config: ConfigService,
              private readonly payLinkClient: PayLinkClient,
              private readonly schedulerRegistry: SchedulerRegistry,
              private readonly panErrorRepo: PanErrorRepo,
              private readonly notificationJobService: NotificationJobService) {
  }

  private async updatePaymentStatuses(): Promise<void> {
    if (this.isJobRunning) {
      return
    }
    
    try {
      this.isJobRunning = true
      await this._updatePaymentStatuses()
    } catch (err) {
      this.logger.error(`Error updating payments status`, err)
    } finally {
      this.isJobRunning = false
    }
  }

  subscribeToPaymentUpdates(paymentId: Payment['id']): Observable<Payment> {
    const subject = this.subjects.get(paymentId) || { subject: new Subject<Payment>(), count: 0 }
    subject.count++
    this.subjects.set(paymentId, subject)
    return subject.subject.asObservable()
  }

  unsubscribeFromPaymentUpdates(paymentId: Payment['id']): void {
    const subject = this.subjects.get(paymentId)
    
    if (subject) {
      subject.count--
      if (subject.count === 0) {
        subject.subject.unsubscribe()
        this.subjects.delete(paymentId)
      }
    }
  }
  
  private notifySubscribers(payment: Payment): void {
    const subject = this.subjects.get(payment.id)
    if (subject && !subject.subject.closed) {
      subject.subject.next(payment)
    }
  }
  
  private async _updatePaymentStatuses(): Promise<void> {
    while (true) {
      const items = await this.paymentRepo.findNotFinished({ size: 1000 })

      if (items.length === 0) {
        break
      }

      const start = Date.now()

      const { concurrency } = this.config.paymentStatusUpdate

      await Bluebird.map(items, v => this.updatePaymentStatus(v), { concurrency })

      this.logger.log(`Updated PayLink status of ${items.length} payment(s) at speed ` +
        `${(1000 * items.length / (Date.now() - start)).toFixed(2)} payment/sec`)
    }
  }

  async updatePaymentStatus(payment: Payment): Promise<void> {
    try {
      await this._updatePaymentStatus(payment)
    } catch (err) {
      this.logger.error(`Error updating payment ${payment.id} PayLink status`, err)
    }
  }

  async _updatePaymentStatus(payment: Payment): Promise<void> {
    const start = Date.now()

    this.logger.log(`Updating payment ${payment.id} PayLink status`)

    try {
      payment = await this.updatePayLinkStatus(payment)
    } finally {
      payment = await this.setPaymentStatusRetryTime(payment.id)
  
      if (payment.isFailed || payment.isFinished) {
        this.notifySubscribers(payment)
        if (payment.notifyUrl) {
          await this.notificationJobService.sendNotification(payment)
        }
      }
    }
    
    this.logger.log(`(${Date.now() - start}ms) Updated payment ${payment.id} PayLink status`)
  }

  private async updatePayLinkStatus(payment: Payment): Promise<Payment> {
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

    const { resultCode } = state
    const status = (resultCode == null || resultCode === '') ? null : Number(state.resultCode)
    const isFinished = FINISHED_PAY_LINK_STATUSES.includes(status)
    const isPending = PENDING_PAY_LINK_STATUSES.includes(status)
    const isExpired = isPending && new Date().getTime() > payment.createDate.getTime() + this.config.payLinkService.sessionExpirationSeconds * 1000
    const isFailed = (!isFinished && !isPending) || isExpired
    const lastOperData = state.oper_data?.at(-1)
    const pan = lastOperData?.PAN?.substring(0, 6)
  
    payment = await this.paymentRepo.update(payment.id, {
      status,
      isFinished,
      isExpired,
      isFailed,
      processingId: lastOperData?.TWO_RESPCODE,
      finishDate: new Date(),
      statusMessage: state.resultDesc ?? null,
      pan,
    })
    
    if (pan && (status === PayLinkStatus.externalDecline || status === PayLinkStatus.ineligibleTransaction)) {
      await this.panErrorRepo.save({ pan, status })
    }
    
    return payment
  }
  
  private async setPaymentStatusRetryTime(paymentId: Payment['id']): Promise<Payment> {
    const payment = await this.paymentRepo.findById(paymentId)
    
    const updateData: UpdatePayment = {}
    
    if (payment.isFailed || payment.isFinished) {
      updateData.statusUpdateStartAt = null
      updateData.notifyRetryAt = null
      updateData.statusUpdateAttempts = 0
    } else {
      if (!updateData.statusUpdateStartAt) {
        updateData.statusUpdateStartAt = new Date()
      }
      updateData.statusUpdateAttempts = payment.statusUpdateAttempts + 1
      const statusUpdateRetryAt = new Date()
      const retryAfterSeconds = this.config.paymentStatusUpdate.minIntervalSeconds
      statusUpdateRetryAt.setSeconds(statusUpdateRetryAt.getSeconds() + retryAfterSeconds)
      updateData.statusUpdateRetryAt = statusUpdateRetryAt
    }
    
    return this.paymentRepo.update(payment.id, updateData)
  }
  
  onApplicationBootstrap() {
    this.schedulerRegistry.addInterval('update-pay-link-status',
      setInterval(this.updatePaymentStatuses.bind(this), this.config.paymentStatusUpdate.minIntervalSeconds *  1000))
  }
}