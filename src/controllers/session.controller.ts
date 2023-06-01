import { Body, Controller, Get, Post, UseInterceptors, UsePipes } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SessionService  } from '../services'
import { ValidationPipe } from '@app/common'
import { LoggingInterceptor } from '../logging'
import { NewSessionDto, NewSessionResultDto } from '../dto'

@Controller('sessions')
@ApiTags('sessions')
@UseInterceptors(LoggingInterceptor)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Створення сесії' })
  @UsePipes(ValidationPipe)
  public async createSession(@Body() newSession: NewSessionDto): Promise<NewSessionResultDto> {
    const newSessionResult = await this.sessionService.createSession(newSession)
    return new NewSessionResultDto(newSessionResult)
  }
}
