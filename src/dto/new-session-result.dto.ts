import { IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator'

export class NewSessionResultDto {
  @IsString() @IsUUID() @IsNotEmpty() paymentId: string

  @IsString() @IsUrl() @IsNotEmpty() frameUrl: string
  
  constructor(data: NewSessionResultDto) {
    Object.assign(this, data)
  }
}
