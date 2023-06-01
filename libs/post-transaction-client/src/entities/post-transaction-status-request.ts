import {
  IsInt,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class PostTransactionStatusRequestBody {
  @IsInt() @IsNotEmpty() readonly actId: number
  
  constructor(data: PostTransactionStatusRequestBody) {
    Object.assign(this, data)
  }
}

export class PostTransactionStatusRequest {
  @IsUUID() @IsNotEmpty() refParam: string
  
  @ValidateNested() @Type(() => PostTransactionStatusRequestBody) @IsNotEmpty() readonly body: PostTransactionStatusRequestBody
  
  constructor(data: PostTransactionStatusRequest) {
    Object.assign(this, data)
  }
}
