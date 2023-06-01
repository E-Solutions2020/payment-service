import { RefundOrder } from './refund-order'

export interface ChangeRefundOrderStatus {
  status: RefundOrder['status']
  note?: RefundOrder['note']
  paymentId?: RefundOrder['paymentId']
}
