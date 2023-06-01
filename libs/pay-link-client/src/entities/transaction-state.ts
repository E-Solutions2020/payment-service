class OperData {
  CREATEDATE?: Date
  TYPE?: string
  REVERSED?: '0' | '1'
  REV_AMOUNT?: number
  AMOUNT?: string
  FEE?: string
  CURRENCY?: string
  PAN?: string
  TWO_RESPCODE?: string
  PG_RESPCODE?: string
  APPROVAL?: string
  IDPROCESSING?: string
  ADDINFO?: string
  RRN?: string
  TRANID?: string
  ORDER_STATE?: string
  ORDER_DESCRIPTION?: string
  ORDERTYPE?: string
  ADD_DATA?: string
  ID?: string
}

export class TransactionState {
  resultCode: string
  resultDesc: string
  sid: string
  sign: string
  oper_data?: OperData[]
  
  constructor(data: TransactionState) {
    Object.assign(this, data)
  }
}
