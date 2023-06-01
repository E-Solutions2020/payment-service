import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PostTransactionStatus } from '../enums'

class PostTransactionResponseBody {
  @IsInt() @IsOptional() readonly actionId?: number
  
  constructor(data: PostTransactionResponseBody) {
    Object.assign(this, data)
  }
}

export class PostTransactionResponse {
  @IsUUID() @IsNotEmpty() refParam: string

  @IsInt() @IsNotEmpty() code: PostTransactionStatus
  
  @ValidateNested() @Type(() => PostTransactionResponseBody) @IsOptional() readonly body?: PostTransactionResponseBody
  
  @IsString() @IsOptional() message?: string
  
  constructor(data: PostTransactionResponse) {
    Object.assign(this, data)
  }
}
