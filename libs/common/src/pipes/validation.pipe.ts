import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { Temporal } from '@js-temporal/polyfill'

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value, metadata: ArgumentMetadata) {
    const { metatype } = metadata
    
    if (value === undefined || !metatype || skipType(metatype)) {
      return value
    }
    
    if (metatype === Number) {
      return transformNumber(value, metadata)
    } else if (metatype === Boolean) {
      return transformBoolean(value, metadata)
    } else if (metatype === Date) {
      return transformDate(value, metadata)
    } else if (isParsableTemporal(metatype)) {
      return transformTemporal(value, metadata)
    }
    
    const instance = plainToInstance(metatype, value, { enableImplicitConversion: true })
    const errors = await validate(instance, { whitelist: true })
    
    if (errors.length > 0) {
      const message = errors.map(v => v.toString()).join('; ')
      throw new BadRequestException(message)
    }
    
    return instance
  }
}

function skipType(metatype): boolean {
  const types = [String, Array, Object]
  return types.some(type => metatype === type)
}

function transformNumber(value, metadata: ArgumentMetadata) {
  const { data, type } = metadata
  
  const transformedValue = Number(value)
  
  if (isNaN(transformedValue)) {
    throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
  }
  
  return transformedValue
}

function transformBoolean(value, metadata: ArgumentMetadata) {
  const { data, type } = metadata
  
  if (typeof value === 'boolean') {
    return value
  } else if (typeof value === 'string') {
    value = value.trim().toLowerCase()
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    }
  }
  
  throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
}

function transformDate(value, metadata: ArgumentMetadata) {
  const { data, type } = metadata
  
  const transformedValue = new Date(value)
  
  if (isNaN(transformedValue.getTime())) {
    throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
  }
  
  return transformedValue
}

type ParsableTemporal = Temporal.Instant | Temporal.ZonedDateTime | Temporal.PlainDate | Temporal.PlainTime | Temporal.PlainDateTime |
  Temporal.PlainYearMonth | Temporal.PlainMonthDay | Temporal.Duration | Temporal.TimeZone | Temporal.Calendar

function isParsableTemporal(metatype: any): boolean {
  return [Temporal.Instant, Temporal.ZonedDateTime, Temporal.PlainDate, Temporal.PlainTime, Temporal.PlainDateTime,
    Temporal.PlainYearMonth, Temporal.PlainMonthDay, Temporal.Duration, Temporal.TimeZone, Temporal.Calendar].includes(metatype)
}

function transformTemporal(value, metadata: ArgumentMetadata): ParsableTemporal  {
  const { data, type, metatype } = metadata
  
  try {
    return (metatype as any).from(value)
  } catch {
    throw new BadRequestException(`Invalid ${data || type} value: ${value}`)
  }
}
