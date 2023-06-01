import { ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common'
import { ValidationPipe } from './validation.pipe'
import { getEnumKeysAndValues } from '@app/common/utils'
import { Enum } from '@app/common/types/enum.type'

@Injectable()
export class EnumValidationPipe extends ValidationPipe {
  private readonly enumKeys?: string[]
  private readonly enumValues?: (string | number)[]
  
  constructor(private readonly enumType: Enum<any>) {
    super()
    const { keys, values } = getEnumKeysAndValues(this.enumType)
    this.enumKeys = keys
    this.enumValues = values
  }
  
  async transform(value, metadata: ArgumentMetadata) {
    const { data, type, metatype } = metadata
    
    if (metatype !== String && metatype !== Number) {
      throw new BadRequestException(`Expected ${data || type} metatype to be an string or number, but received: ${metatype}`)
    }
    
    if (value == null) {
      return value
    }
    
    if (this.enumType[value] === undefined) {
      throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
    }
    
    if (this.enumKeys.includes(value)) {
      return this.enumType[value]
    }
    
    if (this.enumValues.includes(value)) {
      return value
    }
    
    return Number(value)
  }
}