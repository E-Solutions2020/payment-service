import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { PaymentRepo } from '../repositories'
import * as Bluebird from 'bluebird'
import { ConfigService } from '../config'
import { Payment, UpdatePayment } from '../entities'
import { PayStatus, RefundStatus, Scope } from '../enumerations'
import { PayLinkClient, PayLinkStatus } from '@app/pay-link-client'
import { PostTransactionClient } from '@app/post-transaction-client'
import { Client, Issuer, TokenSet } from 'openid-client'
import { NotificationClient, PaymentNotification } from '@app/notification-client'
import { Observable, Subject } from 'rxjs'
import { Temporal } from '@js-temporal/polyfill'

@Injectable()
export class NotificationJobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationJobService.name)
  private isJobRunning = false
  private authClient: Client
  private authTokenSet: TokenSet
  private subjects: Map<Payment['id'], { subject: Subject<Payment>, count: number }> = new Map()

  constructor(private readonly paymentRepo: PaymentRepo,
              private readonly config: ConfigService,
              private readonly payLinkClient: PayLinkClient,
              private readonly postTransactionClient: PostTransactionClient,
              private readonly schedulerRegistry: SchedulerRegistry,
              private readonly issuer: Issuer,
              private readonly notificationClient: NotificationClient) {
    this.authClient = new issuer.Client({
      client_id: this.config.authService.clientId,
      client_secret: this.config.authService.clientSecret,
    })
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
  
  private async sendNotifications(): Promise<void> {
    if (this.isJobRunning) {
      return
    }
    
    try {
      this.isJobRunning = true
      await this._sendNotifications()
    } catch (err) {
      this.logger.error(`Error sending payments notifications`, err)
    } finally {
      this.isJobRunning = false
    }
  }
  
  private async _sendNotifications(): Promise<void> {
    while (true) {
      const items = await this.paymentRepo.findNotNotified({ size: 1000 })

      if (items.length === 0) {
        break
      }

      const start = Date.now()

      const { concurrency } = this.config.notification

      await Bluebird.map(items, v => this.sendNotification(v), { concurrency })

      this.logger.log(`Send ${items.length} notification(s) at speed ` +
        `${(1000 * items.length / (Date.now() - start)).toFixed(2)} notification/sec`)
    }
  }

  async sendNotification(payment: Payment): Promise<void> {
    try {
      await this._sendNotification(payment)
    } catch (err) {
      this.logger.error(`Error sending payment ${payment.id} notification`, err)
    }
  }

  async _sendNotification(payment: Payment): Promise<void> {
    const start = Date.now()

    this.logger.log(`Sending payment ${payment.id} notification`)
  
    const token = await this.getAuthToken()
    
    const updateData: UpdatePayment = {
      notifyAttempts: payment.notifyAttempts + 1,
    }
    
    if (!payment.notifyStartAt) {
      updateData.notifyStartAt = new Date()
    }
    
    try {
      const { status, isExpired, startedPay, refundStatus, isAbsFinished } = payment
      let code: number = isAbsFinished ? PayStatus.finishedAbs : status
      
      if (code == null && isExpired) {
        code = startedPay ? PayStatus.startedPay : PayLinkStatus.sessionExpired
      } else if (refundStatus === RefundStatus.started) {
        code = PayStatus.startedRefund
      } else if (refundStatus === RefundStatus.finished) {
        code = PayStatus.finishedRefund
      }
      
      let paymentTime = null
      if (payment.finishDate) {
        const instant = Temporal.Instant.fromEpochMilliseconds(payment.finishDate.getTime())
        const zonedTime = instant.toZonedDateTime({ timeZone: 'Europe/Kyiv', calendar: 'iso8601' })
        paymentTime = zonedTime.toPlainDateTime()
      }
      
      const notificationData: PaymentNotification = {
        orderId: payment.orderId,
        isExpired: payment.isExpired,
        isFailed: payment.isFailed,
        isFinished: payment.isFinished,
        isSep: payment.isAbsFailed || payment.isAbsFinished,
        code,
        message: payment.statusMessage,
        paymentTime,
        detailsChanged: payment.detailsChanged,
        details: {
          description: payment.description,
          recipient: {
            iban: payment.recipientIban,
            name: payment.recipientName,
            edrpou: payment.recipientEdrpou,
            mfo: payment.recipientMfo,
            bankName: payment.recipientBank,
          }
        }
      }
      
      await this.notificationClient.sendNotification(payment.notifyUrl, token, new PaymentNotification(notificationData))
      
      updateData.isNotified = true
      updateData.notifyRetryAt = null
      updateData.notifyError = null

      payment = await this.paymentRepo.update(payment.id, updateData)

      this.notifySubscribers(payment)
    } catch (err) {
      const notifyRetryAt = new Date()
      const retryAfterSeconds = Math.min(this.config.notification.minIntervalSeconds * 2 ** payment.notifyAttempts,
        this.config.notification.maxIntervalSeconds)
      notifyRetryAt.setSeconds(notifyRetryAt.getSeconds() + retryAfterSeconds)
      updateData.notifyRetryAt = notifyRetryAt
      updateData.notifyError = err.toString()

      await this.paymentRepo.update(payment.id, updateData)

      throw err
    }
  
    const duration = Date.now() - start
    this.logger.log(`(${duration}ms) Sent payment ${payment.id} notification`)
  }
  
  private async getAuthToken(): Promise<string> {
    if (!this.authTokenSet || this.authTokenSet.expired()) {
      this.authTokenSet = await this.authClient.grant({
        grant_type: 'client_credentials',
        scope: Scope.paysvitServer,
      })
    }
    return this.authTokenSet.access_token
  }
  
  onApplicationBootstrap() {
    this.schedulerRegistry.addInterval('send-payment-notifications',
      setInterval(this.sendNotifications.bind(this), this.config.notification.minIntervalSeconds *  1000))
  }
}