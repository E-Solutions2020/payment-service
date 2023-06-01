import { RefundOrder } from './refund-order'

export interface UpdateRefundOrder {
  isPayerNotified?: RefundOrder['isPayerNotified']
  payerNotifyStartAt?: RefundOrder['payerNotifyStartAt']
  payerNotifyRetryAt?: RefundOrder['payerNotifyRetryAt']
  payerNotifyAttempts?: RefundOrder['payerNotifyAttempts']
  payerNotifyError?: RefundOrder['payerNotifyError']
  status?: RefundOrder['status']
  note?: RefundOrder['note']
  paymentId?: RefundOrder['paymentId']
}
