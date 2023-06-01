import {
  Controller, Get, NotFoundException, Param, Sse, UseInterceptors, UsePipes, MessageEvent,
  Req, Put, Patch, ParseUUIDPipe, Body, ForbiddenException, Query, BadRequestException, Logger, Res,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ValidationPipe } from '@app/common'
import { LoggingInterceptor } from '../logging'
import { ChangePaymentDto, PaymentDto } from '../dto'
import { ConfigService } from '../config'
import { PaymentService, PayLinkStatusJobService, NotificationJobService } from '../services'
import { map, merge, Observable } from 'rxjs'
import { Request, Response } from 'express'
import { Payment } from '../entities'

const MAX_PAGE_SIZE = 1000

@Controller('payments')
@ApiTags('payments')
@UseInterceptors(LoggingInterceptor)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)
  private sseCount = 0
  
  constructor(private readonly paymentService: PaymentService,
              private readonly payLinkStatusJobService: PayLinkStatusJobService,
              private readonly notificationJobService: NotificationJobService,
              private readonly config: ConfigService) {}

  @Get(':paymentId')
  @ApiOperation({ summary: 'Отримання платежу по ідентифікатору' })
  @ApiParam({ name: 'paymentId', required: true })
  @UsePipes(ValidationPipe)
  public async getPaymentById(@Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<PaymentDto> {
    const payment = await this.paymentService.findPaymentById(paymentId)
    
    if (!payment) {
      throw new NotFoundException(`Payment by id ${paymentId} not found`)
    }
  
    return this.createPaymentDto(payment)
  }
  
  @Get('transactionId/:transactionId')
  @ApiOperation({ summary: 'Отримання платежу по transactionId' })
  @ApiParam({ name: 'transactionId', required: true })
  @UsePipes(ValidationPipe)
  public async getPaymentByTransactionId(@Param('transactionId', ParseUUIDPipe) transactionId: string): Promise<PaymentDto> {
    const payment = await this.paymentService.findPaymentByTransactionId(transactionId)
    
    if (!payment) {
      throw new NotFoundException(`Payment by transactionId ${transactionId} not found`)
    }
  
    return this.createPaymentDto(payment)
  }

  @Get('sid/:sid')
  @ApiOperation({ summary: 'Отримання платежу по sid' })
  @ApiParam({ name: 'sid', required: true })
  @UsePipes(ValidationPipe)
  public async getPaymentBySid(@Param('sid', ParseUUIDPipe) sid: string): Promise<PaymentDto> {
    const payment = await this.paymentService.findPaymentBySid(sid)
    
    if (!payment) {
      throw new NotFoundException(`Payment by sid ${sid} not found`)
    }
  
    return this.createPaymentDto(payment)
  }
  
  @Get()
  @ApiOperation({ summary: 'Пошук платежів' })
  @ApiQuery({ name: 'createDateFrom', type: Date, required: false, description: 'Початкова дата створення платежу' })
  @ApiQuery({ name: 'createDateTo', type: Date, required: false, description: 'Кінцева дата створення платежу' })
  @ApiQuery({ name: 'description', required: false, description: 'Призначення платежу' })
  @ApiQuery({ name: 'pageNumber', required: false, schema: { type: 'integer', minimum: 0 } })
  @ApiQuery({ name: 'pageSize', required: false, schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE } })  @UsePipes(ValidationPipe)
  public async getPayments(@Query('createDateFrom') createDateFrom?: Date,
                           @Query('createDateTo') createDateTo?: Date,
                           @Query('description') description?: string,
                           @Query('pageNumber') pageNumber?: number,
                           @Query('pageSize') pageSize?: number): Promise<PaymentDto[]> {
    if (pageSize > MAX_PAGE_SIZE) {
      throw new BadRequestException(`Max page size is ${MAX_PAGE_SIZE}, but specified ${pageSize}`)
    }
    
    const params = { createDateFrom, createDateTo, description }
    const page = { number: pageNumber, size: pageSize }
  
    const payments = await this.paymentService.findPayments(params, page)
    
    return payments.map(v => this.createPaymentDto(v))
  }
  
  @Put(':paymentId/start')
  @ApiOperation({ summary: 'Виставлення ознаки переходу на сайт банку' })
  @ApiParam({ name: 'paymentId', required: true })
  @UsePipes(ValidationPipe)
  public async startPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<PaymentDto> {
    let payment = await this.paymentService.findPaymentById(paymentId)
    
    if (!payment) {
      throw new NotFoundException(`Payment by id ${paymentId} not found`)
    }
    
    payment = await this.paymentService.startPayment(paymentId)
  
    return this.createPaymentDto(payment)
  }
  
  @Put(':paymentId/refund')
  @ApiOperation({ summary: 'Повернення коштів' })
  @ApiParam({ name: 'paymentId', required: true })
  @UsePipes(ValidationPipe)
  public async refundPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string): Promise<PaymentDto> {
    let payment = await this.paymentService.findPaymentById(paymentId)
    
    if (!payment) {
      throw new NotFoundException(`Payment by id ${paymentId} not found`)
    }
    
    payment = await this.paymentService.refundPayment(paymentId)
  
    return this.createPaymentDto(payment)
  }
  
  @Sse(':paymentId/sse')
  @ApiOperation({ summary: 'Підписка на Server-Sent Events (SSE) по ідентифікатору платежу' })
  @ApiParam({ name: 'paymentId', required: true })
  @UsePipes(ValidationPipe)
  sse(@Param('paymentId', ParseUUIDPipe) paymentId: string, @Req() req: Request, @Res() res: Response): Observable<MessageEvent> {
    const sseExpirationDate = new Date()
    sseExpirationDate.setSeconds(sseExpirationDate.getSeconds() + this.config.sse.expirationSeconds)
  
    const now = new Date()
    setTimeout(() => res.end(), sseExpirationDate.getTime() - now.getTime())
    
    req.on('close', () => {
      this.logger.log(`SSE count (close): ${--this.sseCount}`)
      this.payLinkStatusJobService.unsubscribeFromPaymentUpdates(paymentId)
      this.notificationJobService.unsubscribeFromPaymentUpdates(paymentId)
    })
  
    this.logger.log(`SSE count (open): ${++this.sseCount}`)
    
    return merge(this.payLinkStatusJobService.subscribeToPaymentUpdates(paymentId), this.notificationJobService.subscribeToPaymentUpdates(paymentId))
      .pipe(map(payment => {
        return { data: this.createPaymentDto(payment) }
      }))
  }
  
  @Patch(':paymentId')
  @ApiOperation({ summary: 'Зміна деталей платежу' })
  @ApiParam({ name: 'paymentId', required: true })
  @UsePipes(ValidationPipe)
  public async changePayment(@Param('paymentId', ParseUUIDPipe) paymentId: string, @Body() data: ChangePaymentDto): Promise<PaymentDto> {
    let payment = await this.paymentService.findPaymentById(paymentId)
  
    if (!payment) {
      throw new NotFoundException(`Payment by id ${paymentId} not found`)
    }
    
    if (!payment.isFinished){
      throw new ForbiddenException(`Payment ${payment.id} is not finished`)
    }
    
    payment = await this.paymentService.changePaymentRecipientOrDescription(paymentId, data)
    
    return this.createPaymentDto(payment)
  }
  
  private createPaymentDto(payment: Payment): PaymentDto {
    const frameUrl = new URL(`frame/pay/?sid=${payment.sid}`, this.config.payLinkService.frontEndUrl).toString()
    return new PaymentDto(payment, frameUrl)
  }
}
