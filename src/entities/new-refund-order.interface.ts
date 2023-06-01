import { RefundOrder } from './refund-order'

export interface NewRefundOrder {
  id: RefundOrder['id']
  numb: RefundOrder['numb']
  notifyUrl?: RefundOrder['notifyUrl']
  returnUrl?: RefundOrder['returnUrl']
  reason: RefundOrder['reason']
  payerName: RefundOrder['payerName']
  payerEdrpou: RefundOrder['payerEdrpou']
  payerPhone: RefundOrder['payerPhone']
  payerEmail: RefundOrder['payerEmail']
  paymentDate: RefundOrder['paymentDate']
  caseNumb?: RefundOrder['caseNumb']
  courtCode: RefundOrder['courtCode']
  amount?: RefundOrder['amount']
  amountAndFee: RefundOrder['amountAndFee']
}
