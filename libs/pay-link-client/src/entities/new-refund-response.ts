export class NewRefundResponse {
  resultCode: string
  resultDesc: string
  sid: string
  sign: string
  
  constructor(data: NewRefundResponse) {
    Object.assign(this, data)
  }
}
