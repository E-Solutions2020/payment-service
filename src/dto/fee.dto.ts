import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'

import { Fee } from '../entities'

export class FeeDto {
  @IsString() @IsUUID() @IsNotEmpty() id: string
  
  @IsString() @IsNotEmpty() paymentCode: string
  
  @IsNumber() @IsNotEmpty() feePercent: number

  @IsNumber() @IsOptional() minFee?: number
  
  @IsString() @IsNotEmpty() description: string
 
  @IsDate() @IsNotEmpty() createDate: Date

  @IsDate() @IsOptional() finishDate?: Date
  
  @IsBoolean() @IsNotEmpty() isDeleted: boolean

  constructor(data: Fee) {
    Object.assign(this, data)
  }
}
