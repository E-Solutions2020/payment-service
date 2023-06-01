import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class PostTransactionRequestBody {
  @IsInt() @IsNotEmpty() readonly terminalContractId: number
  
  @IsString() @IsOptional() readonly processingId: string
  
  @IsString() @IsNotEmpty() readonly tslId: string
 
  @IsString() @IsNotEmpty() readonly currencyCode: string
  
  @IsNumber() @IsNotEmpty() readonly amount: number

  @IsString() @IsNotEmpty() readonly iban: string

  @IsString() @IsNotEmpty() readonly name: string

  @IsString() @IsNotEmpty() readonly okpo: string

  @IsString() @IsNotEmpty() @Length(3, 160) readonly desc: string
  
  constructor(data: PostTransactionRequestBody) {
    Object.assign(this, data)
  }
}

export class PostTransactionRequest {
  @IsUUID() @IsNotEmpty() refParam: string
  
  @ValidateNested() @Type(() => PostTransactionRequestBody) @IsNotEmpty() readonly body: PostTransactionRequestBody
  
  constructor(data: PostTransactionRequest) {
    Object.assign(this, data)
  }
}
