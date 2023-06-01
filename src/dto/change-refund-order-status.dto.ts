import { IsEnum, IsOptional, IsString, IsUUID, Length, } from 'class-validator'
import { getEnumKeysAndValues } from '@app/common/utils'
import { RefundOrderStatus } from '../enumerations'

export class ChangeRefundOrderStatusDto {
  @IsEnum(getEnumKeysAndValues(RefundOrderStatus).values)
  status: RefundOrderStatus
  
  @IsString() @Length(1, 250) @IsOptional() note?: string
  
  @IsUUID() @IsOptional() paymentId?: string
  
  constructor(data: ChangeRefundOrderStatusDto) {
    Object.assign(this, data)
  }
}