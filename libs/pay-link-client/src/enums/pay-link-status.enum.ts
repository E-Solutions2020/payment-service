export enum PayLinkStatus {
  success = 100,
  externalDecline = 200,
  ineligibleTransaction = 304,
  sessionExpired = 316,
  required3DSVerify = 400,
  requiredLookupVerify = 401,
  transactionIsProcessing = 406,
}

export const PENDING_PAY_LINK_STATUSES = [
  null,
  PayLinkStatus.required3DSVerify,
  PayLinkStatus.requiredLookupVerify,
  PayLinkStatus.transactionIsProcessing,
]

export const FINISHED_PAY_LINK_STATUSES = [
  PayLinkStatus.success,
]