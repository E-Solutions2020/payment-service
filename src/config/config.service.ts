import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { LogLevel } from '@nestjs/common/services/logger.service'

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get service(): { version: string, host: string, port: number } {
    return {
      version: String(this.configService.get('npm_package_version')),
      host: String(this.configService.get('SERVICE_HOST')),
      port: Number(this.configService.get('SERVICE_PORT')),
    }
  }
  
  get log(): { level: LogLevel, statIntervalSeconds: number } {
    return {
      level: this.configService.get('LOG_LEVEL'),
      statIntervalSeconds: Number(this.configService.get('LOG_STAT_INTERVAL_SECONDS')),
    }
  }
  
  get db(): { host: string, port: number, username: string, password: string, name: string, schema: string } {
    return {
      host: String(this.configService.get('DB_HOST')),
      port: Number(this.configService.get('DB_PORT')),
      name: String(this.configService.get('DB_NAME')),
      username: String(this.configService.get('DB_USERNAME')),
      password: String(this.configService.get('DB_PASSWORD')),
      schema: String(this.configService.get('DB_SCHEMA')),
    }
  }
  
  get paymentStatusUpdate(): {
    minIntervalSeconds: number,
    maxIntervalSeconds: number,
    concurrency: number,
    giveUpAfterDays: number,
  } {
    return {
      minIntervalSeconds: Number(this.configService.get('PAYMENT_STATUS_UPDATE_MIN_INTERVAL_SECONDS')),
      maxIntervalSeconds: Number(this.configService.get('PAYMENT_STATUS_UPDATE_MAX_INTERVAL_SECONDS')),
      concurrency: Number(this.configService.get('PAYMENT_STATUS_UPDATE_CONCURRENCY')),
      giveUpAfterDays: Number(this.configService.get('PAYMENT_STATUS_UPDATE_GIVE_UP_AFTER_DAYS')),
    }
  }

  get notification(): {
    minIntervalSeconds: number,
    maxIntervalSeconds: number,
    concurrency: number,
    giveUpAfterDays: number,
    onPaymentChange: boolean,
    onPaymentRefund: boolean,
  } {
    return {
      minIntervalSeconds: Number(this.configService.get('NOTIFICATION_MIN_INTERVAL_SECONDS')),
      maxIntervalSeconds: Number(this.configService.get('NOTIFICATION_MAX_INTERVAL_SECONDS')),
      concurrency: Number(this.configService.get('NOTIFICATION_CONCURRENCY')),
      giveUpAfterDays: Number(this.configService.get('NOTIFICATION_GIVE_UP_AFTER_DAYS')),
      onPaymentChange: Boolean(this.configService.get('NOTIFICATION_ON_PAYMENT_CHANGE')),
      onPaymentRefund: Boolean(this.configService.get('NOTIFICATION_ON_PAYMENT_REFUND')),
    }
  }
  
  get payLinkService(): { backEndUrl: string, frontEndUrl: string, terminalId: string, privateKey: string, sessionExpirationSeconds: number } {
    return {
      backEndUrl: String(this.configService.get('PAY_LINK_BACK_END_URL')),
      frontEndUrl: String(this.configService.get('PAY_LINK_FRONT_END_URL')),
      terminalId: String(this.configService.get('PAY_LINK_TERMINAL_ID')),
      privateKey: String(this.configService.get('PAY_LINK_PRIVATE_KEY')),
      sessionExpirationSeconds: Number(this.configService.get('PAY_LINK_SESSION_EXPIRATION_SECONDS')),
    }
  }
  
  get postTransactionService(): {
    serviceUrl: string,
    certificatePfx: Buffer,
    certificatePassword: string,
    basicUsername: string,
    basicPassword: string,
    terminalId: number,
  } {
    return {
      serviceUrl: this.configService.get('POST_TRANSACTION_SERVICE_URL'),
      certificatePfx: this.configService.get('POST_TRANSACTION_CERTIFICATE_PFX'),
      certificatePassword: this.configService.get('POST_TRANSACTION_CERTIFICATE_PASSWORD'),
      basicUsername: this.configService.get('POST_TRANSACTION_BASIC_USERNAME'),
      basicPassword: this.configService.get('POST_TRANSACTION_BASIC_PASSWORD'),
      terminalId: Number(this.configService.get('POST_TRANSACTION_TERMINAL_ID')),
    }
  }
  
  get authService(): { url: string, clientId: string, clientSecret: string } {
    return {
      url: String(this.configService.get('AUTH_SERVICE_URL')),
      clientId: String(this.configService.get('AUTH_CLIENT_ID')),
      clientSecret: String(this.configService.get('AUTH_CLIENT_SECRET')),
    }
  }
  
  get sse(): { expirationSeconds: number } {
    return {
      expirationSeconds: Number(this.configService.get('SSE_EXPIRATION_SECONDS')),
    }
  }
  
  get email(): { host: string, port: number, username: string, password: string, companyName: string, companyPhone: string } {
    return {
      host: String(this.configService.get('EMAIL_HOST')),
      port: Number(this.configService.get('EMAIL_PORT')),
      username: String(this.configService.get('EMAIL_USERNAME')),
      password: String(this.configService.get('EMAIL_PASSWORD')),
      companyName: String(this.configService.get('EMAIL_COMPANY_NAME')),
      companyPhone: String(this.configService.get('EMAIL_COMPANY_PHONE')),
    }
  }
  
  toJSON(): { [key: string]: string | number | boolean } {
    return {
      'service version': this.service.version,
      'service host': this.service.host,
      'service port': this.service.port,
      'log level': this.log.level,
      'log stat interval seconds': this.log.statIntervalSeconds,
      'db host': this.db.host,
      'db port': this.db.port,
      'db name': this.db.name,
      'db username': this.db.username,
      'db password': ConfigService.mask(this.db.password),
      'db schema': this.db.schema,
      'PayLink back end url': this.payLinkService.backEndUrl,
      'PayLink front end url': this.payLinkService.frontEndUrl,
      'PayLink terminal id': this.payLinkService.terminalId,
      'PayLink private key': ConfigService.mask(this.payLinkService.privateKey),
      'PayLink session expiration seconds': this.payLinkService.sessionExpirationSeconds,
      'payment status update min interval seconds': this.paymentStatusUpdate.minIntervalSeconds,
      'payment status update max interval seconds': this.paymentStatusUpdate.maxIntervalSeconds,
      'payment status update concurrency': this.paymentStatusUpdate.concurrency,
      'payment status update give up after days': this.paymentStatusUpdate.giveUpAfterDays,
      'post transaction service url': this.postTransactionService.serviceUrl,
      'post transaction certificate password': ConfigService.mask(this.postTransactionService.certificatePassword),
      'post transaction basic username': ConfigService.mask(this.postTransactionService.basicUsername),
      'post transaction basic password': ConfigService.mask(this.postTransactionService.basicPassword),
      'notification min interval seconds': this.notification.minIntervalSeconds,
      'notification max interval seconds': this.notification.maxIntervalSeconds,
      'notification concurrency': this.notification.concurrency,
      'notification give up after days': this.notification.giveUpAfterDays,
      'auth service url': this.authService.url,
      'auth client id': ConfigService.mask(this.authService.clientId),
      'auth client secret': ConfigService.mask(this.authService.clientSecret),
      'sse expiration seconds': this.sse.expirationSeconds,
      'email host': this.email.host,
      'email port': this.email.port,
      'email username': this.email.username,
      'email password': ConfigService.mask(this.email.password),
      'email company name': this.email.companyName,
      'email company phone': this.email.companyPhone,
    }
  }

  toString(): string {
    return Object.entries(this.toJSON()).map(([key, value]) => `${key}: ${value}`).join('\n')
  }

  static mask(text: string): string {
    if (typeof text !== 'string' || text.length < 3) {
      return text
    }
    return `${text.substring(0, 1)}****${text.substring(text.length - 1)}`
  }
}
