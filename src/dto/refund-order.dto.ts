import {
  IsDate,
  IsDateString, IsEmail, IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString, IsUrl, IsUUID,
  Length, Max, Min,
} from 'class-validator'
import { RefundOrder } from '../entities'
import { RefundOrderStatus } from '../enumerations'
import { getEnumKeysAndValues } from '@app/common/utils'

export class RefundOrderDto {
  @IsUUID() @IsNotEmpty() id: string
  
  @IsString() @IsNotEmpty() numb: string
  
  @IsUUID() @IsOptional() paymentId?: string
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() notifyUrl?: string = null
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() returnUrl?: string = null
  
  @IsString() @Length(1, 200) @IsNotEmpty() reason: string
  
  @IsEnum(getEnumKeysAndValues(RefundOrderStatus).values)
  status: RefundOrderStatus
  
  @IsString() @Length(1, 250) @IsOptional() note?: string
  
  @IsString() @Length(1, 100) @IsNotEmpty() payerName: string
  
  @IsString() @Length(1, 10) @IsNotEmpty() payerEdrpou: string
  
  @IsNumber() @Min(0) @Max(999999999999) @IsNotEmpty() payerPhone: number
  
  @IsEmail() @Length(1, 100) @IsNotEmpty() payerEmail: string
  
  @IsDateString() @IsNotEmpty() paymentDate: string
  
  @IsString() @Length(1, 70) @IsOptional() caseNumb?: string
  
  @IsString() @Length(1, 25) @IsNotEmpty() courtCode: string
  
  @IsNumber() @IsOptional() amount?: number
  
  @IsNumber() @IsNotEmpty() amountAndFee: number
  
  @IsDate() @IsNotEmpty() createDate: Date

  constructor(data: RefundOrder) {
    Object.assign(this, data)
  }
}
