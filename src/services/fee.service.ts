import { Injectable } from '@nestjs/common'
import { PayLinkClient } from '@app/pay-link-client'
import { FeeRepo, PaymentRepo } from '../repositories'
import { Fee } from '../entities'

@Injectable()
export class FeeService {
  constructor(private readonly payLinkClient: PayLinkClient,
              private readonly paymentRepo: PaymentRepo,
              private readonly feeRepo: FeeRepo) {
  }

  async findFeeByPaymentCode(paymentCode: Fee['paymentCode']): Promise<Fee> {
    return this.feeRepo.findByPaymentCode(paymentCode)
  }
}
