import { Controller, Get, NotFoundException, Param, UseInterceptors, UsePipes } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ValidationPipe } from '@app/common'
import { LoggingInterceptor } from '../logging'
import { FeeDto } from '../dto'
import { ConfigService } from '../config'
import { FeeService } from '../services'

@Controller('fee')
@ApiTags('fees')
@UseInterceptors(LoggingInterceptor)
export class FeeController {
  constructor(private readonly feeService: FeeService,
              private readonly config: ConfigService) {}

  @Get('paymentCode/:paymentCode')
  @ApiOperation({ summary: 'Отримання комісії по коду платежу' })
  @ApiParam({ name: 'paymentCode', required: true })
  @UsePipes(ValidationPipe)
  public async getFeeById(@Param('paymentCode') paymentCode: string): Promise<FeeDto> {
    const fee = await this.feeService.findFeeByPaymentCode(paymentCode)
    
    if (!fee) {
      throw new NotFoundException(`Fee by payment code ${paymentCode} not found`)
    }
    
    return new FeeDto(fee)
  }
}
