import { ArgumentMetadata, BadRequestException, Injectable, Type } from '@nestjs/common'
import { ValidationPipe } from './validation.pipe'
import { getEnumKeysAndValues } from '@app/common/utils'
import { Enum } from '@app/common/types/enum.type'

export interface ArrayValidationPipeOptions {
  itemType?: Type
  enum?: Enum<any>
}

@Injectable()
export class ArrayValidationPipe extends ValidationPipe {
  private readonly enumKeys?: string[]
  private readonly enumValues?: (string | number)[]
  
  constructor(private readonly options: ArrayValidationPipeOptions = {}) {
    super()
    if (this.options.enum) {
      const { keys, values } = getEnumKeysAndValues(this.options.enum)
      this.enumKeys = keys
      this.enumValues = values
    }
  }

  async transform(value, metadata: ArgumentMetadata) {
    const { data, type, metatype } = metadata

    if (metatype !== Array) {
      throw new BadRequestException(`Expected ${data || type} metatype to be an array, but received: ${metatype}`)
    }

    if (value == null) {
      return []
    }
    
    if (!Array.isArray(value)) {
      if (typeof value === 'string') {
        value = stringToArray(value)
      } else {
        value = [value]
      }
    }

    let transformedValue: any[]
    
    if (this.options.itemType !== undefined) {
      transformedValue = []
      for (const item of value) {
        transformedValue.push(await super.transform(item, { data, type, metatype: this.options.itemType }))
      }
    } else {
      transformedValue = value
    }
    
    if (this.options.enum !== undefined) {
      const invalidItems = transformedValue.filter(item => this.options.enum[item] === undefined)

      if (invalidItems.length > 0) {
        throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
      }
  
      transformedValue = transformedValue.map(keyOrValue => {
        if (this.enumKeys.includes(keyOrValue)) {
          return this.options.enum[keyOrValue]
        }

        if (this.enumValues.includes(keyOrValue)) {
          return keyOrValue
        }
        
        return Number(keyOrValue)
      })
    }
    
    return transformedValue
  }
}

function stringToArray(value) {
  if (value.startsWith('[')) {
    value = value.substring(1)
  }
  
  if (value.endsWith(']')) {
    value = value.substring(0, value.length - 1)
  }
  
  return value.length === 0 ? [] : value.split(',')
}
