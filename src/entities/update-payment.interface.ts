import { Payment } from './payment'

export interface UpdatePayment {
  startedPay?: Payment['startedPay']
  detailsChanged?: Payment['detailsChanged']
  status?: Payment['status']
  statusUpdateStartAt?: Payment['statusUpdateStartAt']
  statusUpdateRetryAt?: Payment['statusUpdateRetryAt']
  statusUpdateAttempts?: Payment['statusUpdateAttempts']
  absStatus?: Payment['absStatus']
  processingId?: Payment['processingId']
  absActionId?: Payment['absActionId']
  absActionStatus?: Payment['absActionStatus']
  absActionTime?: Payment['absActionTime']
  finishDate?: Payment['finishDate']
  finishAbsDate?: Payment['finishAbsDate']
  isExpired?: Payment['isExpired']
  isFailed?: Payment['isFailed']
  isFinished?: Payment['isFinished']
  isAbsFailed?: Payment['isAbsFailed']
  isAbsFinished?: Payment['isAbsFinished']
  statusMessage?: Payment['statusMessage']
  isNotified?: Payment['isNotified']
  notifyStartAt?: Payment['notifyStartAt']
  notifyRetryAt?: Payment['notifyRetryAt']
  notifyError?: Payment['notifyError']
  notifyAttempts?: Payment['notifyAttempts']
  recipientIban?: Payment['recipientIban']
  recipientName?: Payment['recipientName']
  recipientEdrpou?: Payment['recipientEdrpou']
  recipientMfo?: Payment['recipientMfo']
  recipientBank?: Payment['recipientBank']
  description?: Payment['description']
  refundStatus?: Payment['refundStatus']
  refundStatusCode?: Payment['refundStatusCode']
  refundStatusMessage?: Payment['refundStatusMessage']
  refundAmount?: Payment['refundAmount']
  pan?: Payment['pan']
}
