import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { PaymentRepo, PaymentSearchParams } from '../repositories'
import { Payment, UpdatePayment } from '../entities'
import { ChangePaymentDto } from '../dto'
import { PayLinkClient, PayLinkStatus } from '@app/pay-link-client'
import { RefundStatus } from '../enumerations'
import { ConfigService } from '../config'
import { Page } from '@app/common'

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepo: PaymentRepo,
              private readonly payLinkClient: PayLinkClient,
              private readonly configService: ConfigService) {}

  async findPaymentById(paymentId: Payment['id']): Promise<Payment> {
    return this.paymentRepo.findById(paymentId)
  }

  async findPaymentByTransactionId(transactionId: Payment['transactionId']): Promise<Payment> {
    return this.paymentRepo.findByTransactionId(transactionId)
  }

  async findPaymentBySid(sid: Payment['sid']): Promise<Payment> {
    return this.paymentRepo.findBySid(sid)
  }
  
  public async findPayments(params: PaymentSearchParams = {}, page?: Page): Promise<Payment[]> {
    return this.paymentRepo.find(params, page)
  }
  
  async startPayment(paymentId: Payment['id']): Promise<Payment> {
    return this.paymentRepo.update(paymentId, { startedPay: true })
  }

  async refundPayment(payment: Payment | Payment['id']): Promise<Payment> {
    if (!(payment instanceof Payment)) {
      const paymentId = payment
      payment = await this.paymentRepo.findById(paymentId)
      if (!payment) {
        throw new NotFoundException(`Payment by id ${paymentId} not found`)
      }
    }
  
    if (payment.refundStatus === RefundStatus.started) {
      throw new ForbiddenException(`Payment ${payment.id} refund process already started`)
    } else if (payment.refundStatus === RefundStatus.finished) {
      throw new ForbiddenException(`Payment ${payment.id} already refunded`)
    }
    
    const refundResponse = await this.payLinkClient.createRefundRequest({
      type: 'refund',
      sid: payment.sid,
    })
  
    const { resultCode, resultDesc } = refundResponse
  
    if (resultCode !== '100') {
      await this.paymentRepo.update(payment.id, {
        refundStatus: RefundStatus.failed,
        refundStatusCode: Number(resultCode),
        refundStatusMessage: resultDesc,
      })
      throw new InternalServerErrorException(`Unexpected response: ${JSON.stringify(refundResponse)}`)
    }
  
    const updateData: UpdatePayment = {
      refundStatus: RefundStatus.started,
      refundStatusCode: Number(resultCode),
      refundStatusMessage: resultDesc ?? null,
    }
    
    if (this.configService.notification.onPaymentRefund) {
      updateData.isNotified = false
      updateData.notifyStartAt = null
      updateData.notifyRetryAt = null
      updateData.notifyError = null
      updateData.notifyAttempts = 0
    }
    
    return this.paymentRepo.update(payment.id, updateData)
  }
  
  async changePaymentRecipientOrDescription(payment: Payment | Payment['id'], data: ChangePaymentDto): Promise<Payment> {
    if (!(payment instanceof Payment)) {
      payment = await this.paymentRepo.findById(payment)
      if (!payment) {
        throw new NotFoundException(`Payment by id ${payment} not found`)
      }
    }
    
    if (!payment.isAbsFinished){
      throw new ForbiddenException(`Payment ${payment.id} is not finished`)
    } else if (payment.refundStatus === RefundStatus.started) {
      throw new ForbiddenException(`Payment ${payment.id} refund process already started`)
    } else if (payment.refundStatus === RefundStatus.finished) {
      throw new ForbiddenException(`Payment ${payment.id} already refunded`)
    }
  
    const { recipient, description } = data
    
    if (!recipient && !description) {
      return payment
    }
    
    const updateData: UpdatePayment = {
      status: PayLinkStatus.success,
      absStatus: null,
      absActionId: null,
      absActionStatus: null,
      statusMessage: null,
      finishAbsDate: null,
      isAbsFinished: false,
      isAbsFailed: false,
      detailsChanged: true,
    }
    
    if (this.configService.notification.onPaymentChange) {
      updateData.isNotified = false
      updateData.notifyStartAt = null
      updateData.notifyRetryAt = null
      updateData.notifyError = null
      updateData.notifyAttempts = 0
    }
    
    if (recipient) {
      updateData.recipientIban = recipient.iban
      updateData.recipientName = recipient.name
      updateData.recipientEdrpou = recipient.edrpou
      updateData.recipientMfo = recipient.mfo
      updateData.recipientBank = recipient.bankName
    }
    
    if (description) {
      updateData.description = description
    }
    
    return this.paymentRepo.update(payment.id, updateData)
  }
}
