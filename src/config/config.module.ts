import { Module } from '@nestjs/common'
import { ConfigService } from './config.service'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import validationSchema from './config.schema'

@Module({
  imports: [
    NestConfigModule.forRoot({ validationSchema, envFilePath: 'setup/.env' })
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
