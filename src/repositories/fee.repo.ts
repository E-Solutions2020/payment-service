import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Fee } from '../entities'

@Injectable()
export class FeeRepo {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepo: Repository<Fee>,
  ) {}
  
  public findByPaymentCode(paymentCode: Fee['paymentCode']): Promise<Fee> {
    return this.feeRepo.findOne({ where: { paymentCode } })
  }
}
