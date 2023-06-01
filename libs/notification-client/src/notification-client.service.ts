import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PaymentNotification } from './entities'

@Injectable()
export class NotificationClient {
	private readonly logger = new Logger(NotificationClient.name)
	
	constructor(private readonly httpService: HttpService) {}
	
	async sendNotification(url: URL | string, token: string, paymentNotification: PaymentNotification): Promise<void> {
		this.logger.log(`Send notification for url: ${url}, orderId: ${paymentNotification.orderId}`)
		this.logger.debug(JSON.stringify(paymentNotification, null, 1))
		
		await firstValueFrom(this.httpService.post(url.toString(), paymentNotification, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			validateStatus: status => [HttpStatus.OK, HttpStatus.CREATED, HttpStatus.NO_CONTENT].includes(status)
		}))
		
		this.logger.log(`Sent notification for url: ${url}, orderId: ${paymentNotification.orderId}`)
	}
}