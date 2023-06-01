import { Temporal } from '@js-temporal/polyfill'

class Recipient {
  iban: string
  name: string
  edrpou: string
  mfo: string
  bankName: string
}

interface PaymentDetails {
  description: string
  recipient: Recipient
}

export class PaymentNotification {
  orderId: string
  isExpired: boolean
  isFailed: boolean
  isFinished: boolean
  isSep: boolean
  code: number
  message?: string = null
  paymentTime?: Temporal.PlainDateTime = null
  detailsChanged: boolean
  details: PaymentDetails
  
  constructor(data: PaymentNotification) {
    Object.assign(this, data)
  }
}