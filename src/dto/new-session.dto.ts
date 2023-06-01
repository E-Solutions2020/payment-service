import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

const priceRegex = /^\d+(.\d{1,2})?$/
const ISO_4217_UAH = '980'

export class AuthClientDto {
  @IsString() @IsNotEmpty() id: string
  
  @IsString() @IsNotEmpty() name: string
  
  constructor(data: AuthClientDto) {
    Object.assign(this, data)
  }
}

export class ClientDto {
  @IsString() @Length(1, 50) @IsNotEmpty() readonly cardHolderName: string

  @IsString() @Length(1, 20) @IsNotEmpty() readonly billAddrCity: string

  @IsString() @Length(3, 3) @Matches(/^\d+$/) @IsNotEmpty() readonly billAddrCountry: string

  @IsString() @Length(1, 50) @IsNotEmpty() readonly billAddrLine1: string

  @IsString() @Length(1, 50) @IsOptional() readonly billAddrLine2: string

  @IsString() @Length(1, 50) @IsOptional() readonly billAddrLine3: string

  @IsString() @Length(1, 16) @IsNotEmpty() readonly billAddrPostCode: string

  @IsString() @Length(1, 3) @IsNotEmpty() readonly billAddrState: string

  @IsString() @Length(12, 12) @Matches(/^380\d+$/) @IsNotEmpty() readonly billMobilePhone: string

  @IsString() @IsEmail() @Length(1, 50) @IsNotEmpty() readonly billEmail: string

  constructor(data: ClientDto) {
    Object.assign(this, data)
  }
}

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

export class NewSessionDto {
  @ValidateNested() @Type(() => AuthClientDto) @IsNotEmpty() readonly authClient: AuthClientDto
  
  @IsString() @IsNotEmpty() orderId: string
  
  @IsString() @IsUrl() @Length(1, 500) @IsOptional() callback?: string
  
  @IsString() @Length(1, 1000) @IsNotEmpty() description: string
  
  @IsString() @Length(1, 10) @Matches(priceRegex) @IsNotEmpty() amount: string
  
  @IsString() @IsOptional() caseNumb?: string
  
  @IsString() @IsNotEmpty() paymentCode: string
  
  @IsString() @Length(3, 3) @Matches(/^\d+$/) @IsOptional() currency: string = ISO_4217_UAH
  
  @ValidateNested() @Type(() => ClientDto) @IsOptional() readonly client?: ClientDto
  
  @ValidateNested() @Type(() => RecipientDto) @IsNotEmpty() readonly recipient: RecipientDto
  
  @IsString() @IsOptional() payer?: string
  
  @IsString() @IsUrl() @Length(1, 200) @IsOptional() notifyUrl?: string
  
  constructor(data: NewSessionDto) {
    Object.assign(this, data)
  }
}
