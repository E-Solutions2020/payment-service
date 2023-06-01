import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

const priceRegex = /^\d+(.\d{1,2})?$/

export class Client {
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
  
  constructor(data: Client) {
    Object.assign(this, data)
  }
}

export class NewSession {
  @IsString() @IsNotEmpty() type: string

  @IsString() @IsNotEmpty() @Length(1, 1) merchant: string

  @IsString() @IsNotEmpty() @Length(1, 1) tranid: string

  @IsString() @IsNotEmpty() @Length(1, 2) @Matches(/^\d+$/) ordertype: string

  @IsString() @IsUrl() @Length(1, 500) @IsOptional() callback?: string
  
  @IsString() @Length(1, 1000) @IsNotEmpty() description: string
  
  @IsString() @Length(1, 10) @Matches(priceRegex) @IsNotEmpty() amount: string
  
  @IsString() @Length(1, 10) @Matches(priceRegex) @IsNotEmpty() fee: string
  
  @IsString() @Length(3, 3) @Matches(/^\d+$/) @IsNotEmpty() currency: string
  
  @ValidateNested() @Type(() => Client) @IsOptional() readonly clientParams?: Client
  
  constructor(data: NewSession) {
    Object.assign(this, data)
  }
}
