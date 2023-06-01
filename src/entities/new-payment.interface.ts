import { Payment } from './payment'

export interface NewPayment {
  id?: Payment['id']
  authClientId: Payment['authClientId']
  authClientName: Payment['authClientName']
  orderId: Payment['orderId']
  sid: Payment['sid']
  currency: Payment['currency']
  amount: Payment['amount']
  feeTypeId: Payment['feeTypeId'],
  fee?: Payment['fee']
  recipientIban: Payment['recipientIban']
  recipientName: Payment['recipientName']
  recipientEdrpou: Payment['recipientEdrpou']
  recipientMfo: Payment['recipientMfo']
  recipientBank: Payment['recipientBank']
  payer?: Payment['payer']
  description: Payment['description']
  transactionId: Payment['transactionId']
  notifyUrl?: Payment['notifyUrl']
}
