import {
  IsDateString, IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString, IsUrl, IsUUID,
  Length, Max, Min,
} from 'class-validator'

export class NewRefundOrderDto {
  @IsUUID() @IsNotEmpty() id: string
  
  @IsString() @IsNotEmpty() numb: string
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() notifyUrl?: string = null
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() returnUrl?: string = null
  
  @IsString() @Length(1, 200) @IsNotEmpty() reason: string

  @IsString() @Length(1, 100) @IsNotEmpty() payerName: string

  @IsString() @Length(1, 10) @IsNotEmpty() payerEdrpou: string

  @IsNumber() @Min(0) @Max(999999999999) @IsNotEmpty() payerPhone: number
  
  @IsEmail() @Length(1, 100) @IsNotEmpty() payerEmail: string

  @IsDateString() @IsNotEmpty() paymentDate: string
  
  @IsString() @Length(1, 70) @IsOptional() caseNumb?: string

  @IsString() @Length(1, 25) @IsNotEmpty() courtCode: string

  @IsNumber() @IsOptional() amount?: number

  @IsNumber() @IsNotEmpty() amountAndFee: number
  
  constructor(data: NewRefundOrderDto) {
    Object.assign(this, data)
  }
}