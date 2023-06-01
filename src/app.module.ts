import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigModule, ConfigService } from "./config"
import { PaymentController, SessionController } from './controllers'
import {
  FeeService,
  SessionService,
  PaymentService,
  PayLinkStatusJobService,
  NotificationJobService,
  RefundStatusJobService, RefundService, RefundPayerEmailJobService,
} from './services'
import { PayLinkClientModule } from '@app/pay-link-client'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthClientDetails, Fee, PanError, Payment, RefundOrder } from './entities'
import { AuthClientDetailsRepo, FeeRepo, PanErrorRepo, PaymentRepo, RefundOrderRepo } from './repositories'
import { FeeController } from './controllers/fee.controller'
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule'
import { PostTransactionClientModule } from '@app/post-transaction-client'
import { Issuer } from 'openid-client'
import { NotificationClientModule } from '@app/notification-client'
import { HttpAdapterHost } from '@nestjs/core'
import { PostTransactionStatusJobService } from './services/post-transaction-status-job.service'
import { RefundController } from './controllers/refund.controller'
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    PayLinkClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.payLinkService.backEndUrl,
        signKey: configService.payLinkService.privateKey,
      }),
    }),
    PostTransactionClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.postTransactionService.serviceUrl,
        certificatePfx: configService.postTransactionService.certificatePfx,
        certificatePassword: configService.postTransactionService.certificatePassword,
        basicUsername: configService.postTransactionService.basicUsername,
        basicPassword: configService.postTransactionService.basicPassword,
      }),
    }),
    NotificationClientModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.db.host,
        port: configService.db.port,
        database: configService.db.name,
        username: configService.db.username,
        password: configService.db.password,
        schema: configService.db.schema,
        entities: [Payment, PanError, Fee, AuthClientDetails, RefundOrder],
        synchronize: false,
        logging: configService.log.level === 'verbose' ? 'all' : ['error'],
      }),
    }),
    TypeOrmModule.forFeature([Payment, PanError, Fee, AuthClientDetails, RefundOrder]),
    MailModule,
  ],
  controllers: [SessionController, PaymentController, FeeController, RefundController],
  providers: [
    SessionService,
    PaymentService,
    PayLinkStatusJobService,
    PostTransactionStatusJobService,
    RefundStatusJobService,
    NotificationJobService,
    RefundPayerEmailJobService,
    FeeService,
    RefundService,
    PaymentRepo,
    PanErrorRepo,
    FeeRepo,
    AuthClientDetailsRepo,
    RefundOrderRepo,
    {
      provide: Issuer,
      useFactory: async (configService: ConfigService) => {
        try {
          return await Issuer.discover(configService.authService.url)
        } catch (err) {
          throw new Error(`Error connecting to auth service: ${err}`)
        }
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name)
  
  constructor(private readonly adapterHost: HttpAdapterHost,
              private readonly config: ConfigService,
              private readonly schedulerRegistry: SchedulerRegistry) {}
  
  onApplicationBootstrap(): any {
    this.schedulerRegistry.addInterval('log-stat',
      setInterval(this.logStat.bind(this), this.config.log.statIntervalSeconds *  1000))
  }
  
  private logStat() {
    this.adapterHost.httpAdapter.getHttpServer().getConnections((err, count) => {
      this.logger.log(`Active connections: ${count}`)
    })
  }
}
