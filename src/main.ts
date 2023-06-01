import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from './config'
import { Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SerializerInterceptor } from '@app/common'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true })
  app.setGlobalPrefix('api')
  app.useGlobalInterceptors(new SerializerInterceptor(app.get(Reflector)))
  app.disable('x-powered-by')

  const configService = app.get(ConfigService)
  
  Logger.overrideLogger([configService.log.level])
  
  const logger = new Logger('main')
  
  const { host, port, version } = configService.service

  const config = new DocumentBuilder()
    .setTitle('Paysvit Payment')
    .setDescription(`Сервіс для реєстрації та проведення платежів`)
    .setVersion(version)
    .addTag('sessions', 'Сесія')
    .addTag('refund orders', 'Повернення коштів')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swg', app, document, { customSiteTitle: 'Paysvit Payment' })

  await app.listen(port, host)

  logger.log(`App started at ${host}:${port} with settings:\n${configService}`)
}

bootstrap()
