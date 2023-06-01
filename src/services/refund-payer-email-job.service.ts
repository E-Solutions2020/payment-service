import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { RefundOrderRepo } from '../repositories'
import * as Bluebird from 'bluebird'
import { ConfigService } from '../config'
import { RefundOrder, UpdateRefundOrder } from '../entities'
import { MailService } from '../mail/mail.service'

@Injectable()
export class RefundPayerEmailJobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RefundPayerEmailJobService.name)
  private isJobRunning = false
  private activeNotifications: Set<RefundOrder['id']> = new Set()
  
  constructor(private readonly refundOrderRepo: RefundOrderRepo,
              private readonly config: ConfigService,
              private readonly schedulerRegistry: SchedulerRegistry,
              private readonly mailService: MailService) {
  }
  
  private async sendPayerEmails(): Promise<void> {
    if (this.isJobRunning) {
      return
    }
    
    try {
      this.isJobRunning = true
      await this._sendPayerEmails()
    } catch (err) {
      this.logger.error(`Error sending payer emails`, err)
    } finally {
      this.isJobRunning = false
    }
  }
  
  private async _sendPayerEmails(): Promise<void> {
    while (true) {
      const items = await this.refundOrderRepo.findNotNotifiedPayer({ size: 1000 })
      
      if (items.length === 0) {
        break
      }
      
      const start = Date.now()
      
      const { concurrency } = this.config.notification
      
      await Bluebird.map(items, v => this.sendPayerEmail(v), { concurrency })
      
      this.logger.log(`Send ${items.length} payer email(s) at speed ` +
        `${(1000 * items.length / (Date.now() - start)).toFixed(2)} email/sec`)
    }
  }
  
  async sendPayerEmail(payment: RefundOrder): Promise<void> {
    try {
      if (this.activeNotifications.has(payment.id)) {
        return
      }
      this.activeNotifications.add(payment.id)
      await this._sendPayerEmail(payment)
    } catch (err) {
      this.logger.error(`Error sending payment ${payment.id} notification`, err)
    } finally {
      this.activeNotifications.delete(payment.id)
    }
  }
  
  async _sendPayerEmail(refundOrder: RefundOrder): Promise<void> {
    const start = Date.now()
    
    this.logger.log(`Sending refund order ${refundOrder.id} payer email`)
    
    const updateData: UpdateRefundOrder = {
      payerNotifyAttempts: refundOrder.payerNotifyAttempts + 1,
    }
    
    if (!updateData.payerNotifyStartAt) {
      updateData.payerNotifyStartAt = new Date()
    }
    
    try {
      await this.mailService.sendRefundPayerEmail(refundOrder)
      updateData.isPayerNotified = true
      updateData.payerNotifyRetryAt = null
      updateData.payerNotifyError = null
      refundOrder = await this.refundOrderRepo.update(refundOrder.id, updateData)
    } catch (err) {
      const payerNotifyRetryAt = new Date()
      const retryAfterSeconds = Math.min(this.config.notification.minIntervalSeconds * 2 ** refundOrder.payerNotifyAttempts,
        this.config.notification.maxIntervalSeconds)
      payerNotifyRetryAt.setSeconds(payerNotifyRetryAt.getSeconds() + retryAfterSeconds)
      updateData.payerNotifyRetryAt = payerNotifyRetryAt
      updateData.payerNotifyError = err.toString()
      await this.refundOrderRepo.update(refundOrder.id, updateData)
      throw err
    }
    
    const duration = Date.now() - start
    this.logger.log(`(${duration}ms) Sent refund order ${refundOrder.id} payer email`)
  }
  
  onApplicationBootstrap() {
    this.schedulerRegistry.addInterval('send-payer-emails',
      setInterval(this.sendPayerEmails.bind(this), this.config.notification.minIntervalSeconds *  1000))
  }
}