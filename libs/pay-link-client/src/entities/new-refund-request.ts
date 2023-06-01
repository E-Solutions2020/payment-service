export class NewRefundRequest {
  type: 'refund'
  sid: string
  amount?: string
  withFee?: 'Y'
  
  constructor(data: NewRefundRequest) {
    Object.assign(this, data)
  }
}
