import {
  IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsUrl, IsUUID, Length, Matches, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Payment } from '../entities'
import { FeeDto } from './fee.dto'
import { RefundStatus } from '../enumerations'

const priceRegex = /^\d+(.\d{1,2})?$/
const ISO_4217_UAH = '980'

class RecipientDto {
  @IsString() @IsNotEmpty() iban: string
  
  @IsString() @IsNotEmpty() name: string
  
  @IsString() @IsNotEmpty() edrpou: string
  
  @IsString() @IsNotEmpty() mfo: string
  
  @IsString() @IsNotEmpty() bankName: string
  
  constructor(data: RecipientDto) {
    Object.assign(this, data)
  }
}

class PayLinkStatusDto {
  @IsBoolean() @IsNotEmpty() isExpired: boolean
  
  @IsBoolean() @IsNotEmpty() isFinished: boolean

  @IsBoolean() @IsNotEmpty() isFailed: boolean

  @IsBoolean() @IsNotEmpty() isNotified: boolean
  
  @IsInt() @IsOptional() code?: number = null

  @IsString() @IsOptional() message?: string = null
  
  constructor(data: PayLinkStatusDto) {
    Object.assign(this, data)
  }
}

class PayLinkAbsStatusDto {
  @IsNumber() @IsOptional() absActionId?: number
  
  @IsDate() @IsOptional() absActionTime?: Date
  
  @IsDate() @IsOptional() finishAbsDate?: Date
  
  @IsString() @IsOptional() absActionStatus?: string
  
  @IsNumber() @IsOptional() absStatus?: number
  
  constructor(data: PayLinkAbsStatusDto) {
    Object.assign(this, data)
  }
}

class RefundDto {
  @IsEnum(RefundStatus) @IsOptional() readonly status?: RefundStatus
  
  @IsInt() @IsOptional() statusCode?: number = null
  
  @IsString() @IsOptional() statusMessage?: string = null
  
  @IsNumber() @IsOptional() amount?: number = null
  
  constructor(data: RefundDto) {
    Object.assign(this, data)
  }
}

export class PaymentDto {
  @IsString() @IsUUID() @IsNotEmpty() id: string
  
  @IsString() @IsNotEmpty() orderId: string
  
  @IsString() @IsNotEmpty() sid: string
 
  @IsString() @IsNotEmpty() transactionId: string
  
  @IsString() @IsUrl() @IsNotEmpty() frameUrl: string
  
  @IsString() @IsUrl() @Length(1, 500) @IsOptional() callback?: string
 
  @IsString() @Length(1, 1000) @IsNotEmpty() description: string
  
  @IsString() @Length(1, 10) @Matches(priceRegex) @IsNotEmpty() amount: string
  
  @ValidateNested() @Type(() => FeeDto) @IsNotEmpty() readonly feeType: FeeDto
  
  @IsString() @Length(1, 10) @Matches(priceRegex) @IsNotEmpty() fee: string

  @IsString() @Length(3, 3) @Matches(/^\d+$/) @IsOptional() currency: string = ISO_4217_UAH
  
  @ValidateNested() @Type(() => RecipientDto) @IsNotEmpty() readonly recipient: RecipientDto
  
  @IsString() @IsOptional() payer?: string
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() notifyUrl?: string
  
  @ValidateNested() @Type(() => PayLinkStatusDto) @IsNotEmpty() readonly status: PayLinkStatusDto

  @ValidateNested() @Type(() => PayLinkAbsStatusDto) @IsNotEmpty() readonly abs: PayLinkAbsStatusDto
  
  @ValidateNested() @Type(() => RefundDto) @IsNotEmpty() readonly refund: RefundDto
  
  @IsDate() @IsOptional() paymentTime?: Date
  
  @IsBoolean() @IsNotEmpty() startedPay: boolean

  @IsBoolean() @IsNotEmpty() detailsChanged: boolean

  @IsDate() @IsNotEmpty() createDate: Date
  
  constructor(data: Payment, frameUrl: string) {
    Object.assign(this, {
      ...data,
      amount: String(data.amount),
      fee: data.fee != null && String(data.fee),
      feeType: new FeeDto(data.feeType),
      recipient: new RecipientDto({
        iban: data.recipientIban,
        name: data.recipientName,
        edrpou: data.recipientEdrpou,
        mfo: data.recipientMfo,
        bankName: data.recipientBank,
      }),
      frameUrl,
      status: new PayLinkStatusDto({
        isFinished: data.isFinished,
        isExpired: data.isExpired,
        isFailed: data.isFailed,
        isNotified: data.isNotified,
        code: data.absStatus ?? data.status,
        message: data.statusMessage,
      }),
      abs: new PayLinkAbsStatusDto({
        absActionId: data.absActionId,
        absActionTime: data.absActionTime,
        finishAbsDate: data.finishAbsDate,
        absActionStatus: data.absActionStatus,
        absStatus: data.absStatus,
      }),
      refund: new RefundDto({
        status: data.refundStatus,
        statusCode: data.refundStatusCode,
        statusMessage: data.refundStatusMessage,
        amount: data.refundAmount,
      }),
      paymentTime: data.isFinished ? data.finishDate : null,
      startedPay: data.startedPay,
      detailsChanged: data.detailsChanged,
    })
  }
}
