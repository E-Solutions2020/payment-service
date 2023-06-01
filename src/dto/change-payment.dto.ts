import { IsNotEmpty, IsOptional, IsString, Length, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

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

export class ChangePaymentDto {
  @IsString() @Length(1, 1000) @IsOptional() description: string
  
  @ValidateNested() @Type(() => RecipientDto) @IsOptional() readonly recipient: RecipientDto
  
  constructor(data: ChangePaymentDto) {
    Object.assign(this, data)
  }
}
