import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class NewSessionResponse {
  @IsString() @IsNotEmpty() resultCode: string

  @IsString() @IsNotEmpty() resultDesc: string
  
  @IsString() @IsOptional() sid?: string
  
  @IsString() @IsOptional() ordertype?: string
  
  @IsString() @IsOptional() merchant?: string
  
  @IsString() @IsOptional() sign?: string
  
  constructor(data: NewSessionResponse) {
    Object.assign(this, data)
  }
}
