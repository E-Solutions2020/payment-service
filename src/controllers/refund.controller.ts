import {
  BadRequestException,
  Body,
  Controller, Get, NotFoundException, Param, ParseUUIDPipe,
  Post, Put, Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { RefundService } from '../services'
import { EnumValidationPipe, ValidationPipe } from '@app/common'
import { LoggingInterceptor } from '../logging'
import { NewRefundOrderDto } from '../dto'
import { RefundOrderDto } from '../dto/refund-order.dto'
import { RefundOrderStatus } from '../enumerations'
import { getEnumKeysAndValues } from '@app/common/utils'
import { ChangeRefundOrderStatusDto } from '../dto/change-refund-order-status.dto'

const MAX_PAGE_SIZE = 1000

@Controller('refund-orders')
@ApiTags('refund orders')
@UseInterceptors(LoggingInterceptor)
@UsePipes(ValidationPipe)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}
  
  @Post()
  @ApiOperation({ summary: 'Створення звернення на повернення коштів' })
  public async createRefundOrder(@Body() newRefundOrder: NewRefundOrderDto): Promise<RefundOrderDto> {
    const refundOrder = await this.refundService.createRefundOrder(newRefundOrder)
    return new RefundOrderDto(refundOrder)
  }
  
  @Get()
  @ApiOperation({ summary: 'Пошук зверненнь на повернення коштів' })
  @ApiQuery({ name: 'createDateFrom', type: Date, required: false, description: 'Початкова дата створення звернення' })
  @ApiQuery({ name: 'createDateTo', type: Date, required: false, description: 'Кінцева дата створення звернення' })
  @ApiQuery({ name: 'status', required: false, type: 'enum', enum: RefundOrderStatus, description: 'Статус звернення' })
  @ApiQuery({ name: 'payerName', required: false, description: 'ПІБ Платника' })
  @ApiQuery({ name: 'payerEdrpou', required: false, description: 'ЄДРПОУ/РНОКПП Платника' })
  @ApiQuery({ name: 'caseNumb', required: false, description: 'Номер судової справи' })
  @ApiQuery({ name: 'courtCode', required: false, description: 'Унікальний код суду ЄДРСР 2007' })
  @ApiQuery({ name: 'amount', required: false, description: 'Сума платежу без комісії' })
  @ApiQuery({ name: 'amountAndFee', required: false, description: 'Сума платежу з комісією' })
  @ApiQuery({ name: 'pageNumber', required: false, schema: { type: 'integer', minimum: 0 } })
  @ApiQuery({ name: 'pageSize', required: false, schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE } })
  public async getRefundOrders(@Query('createDateFrom') createDateFrom?: Date,
                           @Query('createDateTo') createDateTo?: Date,
                           @Query('status', new EnumValidationPipe(RefundOrderStatus)) status?: RefundOrderStatus,
                           @Query('payerName') payerName?: string,
                           @Query('payerEdrpou') payerEdrpou?: string,
                           @Query('caseNumb') caseNumb?: string,
                           @Query('courtCode') courtCode?: string,
                           @Query('amount') amount?: number,
                           @Query('amountAndFee') amountAndFee?: number,
                           @Query('pageNumber') pageNumber?: number,
                           @Query('pageSize') pageSize?: number): Promise<RefundOrderDto[]> {
    if (pageSize > MAX_PAGE_SIZE) {
      throw new BadRequestException(`Max page size is ${MAX_PAGE_SIZE}, but specified ${pageSize}`)
    }
    
    const params = {
      createDateFrom,
      createDateTo,
      status,
      payerName,
      payerEdrpou,
      caseNumb,
      courtCode,
      amount,
      amountAndFee,
    }
    const page = { number: pageNumber, size: pageSize }
    
    const refundOrders = await this.refundService.findRefundOrders(params, page)
    
    return refundOrders.map(v => new RefundOrderDto(v))
  }
  
  @Get(':refundOrderId')
  @ApiOperation({ summary: 'Отримання звернення на повернення коштів по ідентифікатору' })
  @ApiParam({ name: 'refundOrderId', required: true })
  public async getPaymentById(@Param('refundOrderId', ParseUUIDPipe) refundOrderId: string): Promise<RefundOrderDto> {
    const refundOrder = await this.refundService.findRefundOrderById(refundOrderId)
    
    if (!refundOrder) {
      throw new NotFoundException(`RefundOrder by id ${refundOrderId} not found`)
    }
    
    return new RefundOrderDto(refundOrder)
  }
  
  @Get('numb/:refundOrderNumb')
  @ApiOperation({ summary: 'Отримання звернення на повернення коштів по номеру' })
  @ApiParam({ name: 'refundOrderNumb', required: true })
  public async getPaymentByNumb(@Param('refundOrderNumb') refundOrderNumb: string): Promise<RefundOrderDto> {
    const refundOrder = await this.refundService.findRefundOrderByNumb(refundOrderNumb)
    
    if (!refundOrder) {
      throw new NotFoundException(`RefundOrder by numb ${refundOrderNumb} not found`)
    }
    
    return new RefundOrderDto(refundOrder)
  }
  
  @Put('numb/:refundOrderNumb/status')
  @ApiOperation({ summary: 'Зміна статусу звернення на повернення коштів' })
  @ApiParam({ name: 'refundOrderNumb', required: true })
  public async changeRefundOrderStatus(@Param('refundOrderNumb') refundOrderNumb: string,
                                       @Body() data: ChangeRefundOrderStatusDto): Promise<RefundOrderDto> {
    const refundOrder = await this.refundService.changeRefundOrderStatus(refundOrderNumb, data)
    return new RefundOrderDto(refundOrder)
  }
}
