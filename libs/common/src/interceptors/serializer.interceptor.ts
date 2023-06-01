import {
  ClassSerializerInterceptor,
  PlainLiteralObject,
  InternalServerErrorException,
  NestInterceptor, Inject, ExecutionContext, CallHandler, StreamableFile,
} from '@nestjs/common'
import { ClassTransformOptions } from 'class-transformer'
import { validate } from 'class-validator'
import { mergeMap, Observable } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { CLASS_SERIALIZER_OPTIONS } from '@nestjs/common/serializer/class-serializer.constants'

const REFLECTOR = 'Reflector'

export class SerializerInterceptor implements NestInterceptor {
  private readonly classSerializerInterceptor
  
  constructor(@Inject(REFLECTOR) protected readonly reflector: Reflector) {
    this.classSerializerInterceptor = new ClassSerializerInterceptor(reflector)
  }
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextOptions = this.getContextOptions(context)
    return next
      .handle()
      .pipe(
        mergeMap((res: PlainLiteralObject | Array<PlainLiteralObject>) =>
          this.serialize(res, contextOptions),
        ),
      )
  }
  
  protected getContextOptions(
    context: ExecutionContext,
  ): ClassTransformOptions | undefined {
    return this.reflector.getAllAndOverride(CLASS_SERIALIZER_OPTIONS, [
      context.getHandler(),
      context.getClass(),
    ])
  }
  
  private async serialize(response: PlainLiteralObject | PlainLiteralObject[], options: ClassTransformOptions) {
    await this.validate(response)
    return this.classSerializerInterceptor.serialize(response, options || {})
  }
  
  private async validate(data: any): Promise<void> {
    if (data == null || data.constructor === Object || data instanceof StreamableFile) {
      return data
    }
    
    if (Array.isArray(data)) {
      for (const value of data) {
        await this.validate(value)
      }
      return
    }
    
    const errors = await validate(data, { whitelist: true })
    
    if (errors.length > 0) {
      const message = errors.map(v => v.constraints ? Object.values(v.constraints).join(', ') : v).join('; ')
      throw new InternalServerErrorException(message)
    }
  }
}