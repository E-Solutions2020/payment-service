import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, tap } from 'rxjs'


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest()

    const start = Date.now()

    this.logger.log(`Request: ${request.method} ${request.url}`)

    return next
      .handle()
      .pipe(
        tap(() => {
          const duration = Date.now() - start
          this.logger.log(`(${duration}ms) Response: ${request.method} ${request.url}`)
        }),
      )
  }
}