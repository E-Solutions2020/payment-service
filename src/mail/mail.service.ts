import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { RefundOrder } from '../entities'
import { ConfigService } from '../config'

@Injectable()
export class MailService {
	constructor(private readonly mailerService: MailerService,
	            private readonly config: ConfigService) {
	}
	
	async sendRefundPayerEmail(refundOrder: RefundOrder) {
		await this.mailerService.sendMail({
			to: refundOrder.payerEmail,
			subject: 'Повернення коштів',
			template: 'refund-payer-email.template.html',
			context: {
				refundOrderNumb: refundOrder.numb,
				companyName: this.config.email.companyName,
				companyPhone: this.config.email.companyPhone,
			},
		})
	}
}
