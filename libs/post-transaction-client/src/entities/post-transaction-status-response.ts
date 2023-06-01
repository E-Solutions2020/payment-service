import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PostTransactionActionStatus, PostTransactionStatus } from '../enums'

class PostTransactionStatusResponseBody {
  @IsString() @IsOptional() readonly actionStatus?: PostTransactionActionStatus
  
  @IsDate() @IsOptional() readonly actionTime?: Date
  
  constructor(data: PostTransactionStatusResponseBody) {
    Object.assign(this, data)
  }
}

export class PostTransactionStatusResponse {
  @IsUUID() @IsNotEmpty() refParam: string
  
  @IsInt() @IsNotEmpty() code: PostTransactionStatus
  
  @ValidateNested() @Type(() => PostTransactionStatusResponseBody) @IsNotEmpty() readonly body?: PostTransactionStatusResponseBody
  
  constructor(data: PostTransactionStatusResponse) {
    Object.assign(this, data)
  }
  
  @IsString() @IsOptional() message?: string
}
