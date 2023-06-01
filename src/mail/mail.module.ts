import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MailerModule } from '@nestjs-modules/mailer'
import { ConfigModule, ConfigService } from '../config'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'

@Module({
	imports: [
		ConfigModule,
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (config: ConfigService) => ({
				transport: {
					host: config.email.host,
					port: config.email.port,
					auth: {
						user: config.email.username,
						pass: config.email.password,
					},
				},
				defaults: {
					from: `"${config.email.companyName}" <${config.email.username}>`,
				},
				template: {
					dir: join(__dirname, 'mail/templates'),
					adapter: new HandlebarsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
			inject: [ConfigService],
		}),
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
