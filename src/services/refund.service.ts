import {
  Injectable, NotFoundException, UnprocessableEntityException,
} from '@nestjs/common'
import { PaymentRepo, RefundOrderRepo, RefundOrderSearchParams } from '../repositories'
import { ChangeRefundOrderStatus, NewRefundOrder, RefundOrder } from '../entities'
import { RefundPayerEmailJobService } from './refund-payer-email-job.service'
import { Page } from '@app/common'

@Injectable()
export class RefundService {
  constructor(private readonly refundOrderRepo: RefundOrderRepo,
              private readonly refundPayerEmailJobService: RefundPayerEmailJobService,
              private readonly paymentRepo: PaymentRepo) {}
  
  async createRefundOrder(newRefundOrder: NewRefundOrder): Promise<RefundOrder> {
    const refundOrder = await this.refundOrderRepo.create(newRefundOrder)
    await this.refundPayerEmailJobService.sendPayerEmail(refundOrder)
    return refundOrder
  }
  
  public async findRefundOrders(params: RefundOrderSearchParams = {}, page?: Page): Promise<RefundOrder[]> {
    return this.refundOrderRepo.find(params, page)
  }
  
  async findRefundOrderById(refundOrderId: RefundOrder['id']): Promise<RefundOrder> {
    return await this.refundOrderRepo.findById(refundOrderId)
  }
  
  async findRefundOrderByNumb(refundOrderNumb: RefundOrder['numb']): Promise<RefundOrder> {
    return await this.refundOrderRepo.findByNumb(refundOrderNumb)
  }
  
  async changeRefundOrderStatus(refundOrder: RefundOrder | RefundOrder['numb'], data: ChangeRefundOrderStatus): Promise<RefundOrder> {
    if (!(refundOrder instanceof RefundOrder)) {
      const refundOrderNumb = refundOrder
      refundOrder = await this.refundOrderRepo.findByNumb(refundOrderNumb)
     
      if (!refundOrder) {
        throw new NotFoundException(`Refund order by numb ${refundOrderNumb} not found`)
      }
    }

    const { paymentId } = data
    
    if (paymentId) {
      const payment = await this.paymentRepo.findById(paymentId)
      
      if (!payment) {
        throw new UnprocessableEntityException(`Payment by id ${paymentId} not found`)
      }
    }
    
    return this.refundOrderRepo.update(refundOrder.id, data)
  }
}
