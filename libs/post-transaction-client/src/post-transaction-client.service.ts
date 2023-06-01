import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { PostTransactionClientOptions } from './post-transaction-client.options'
import {
	PostTransactionRequest,
	PostTransactionResponse,
	PostTransactionStatusRequest,
	PostTransactionStatusResponse,
} from './entities'
import { HttpService, HttpModuleOptions } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { Agent } from 'https'
import { Temporal } from '@js-temporal/polyfill'

@Injectable()
export class PostTransactionClient {
	private readonly config: HttpModuleOptions
	private readonly logger = new Logger(PostTransactionClient.name)
	
	constructor(private readonly options: PostTransactionClientOptions,
	            private readonly httpService: HttpService) {
		this.config = {
			baseURL: options.url,
			auth: {
				username: options.basicUsername,
				password: options.basicPassword
			},
			httpsAgent: new Agent({
				pfx: options.certificatePfx,
				passphrase: options.certificatePassword,
				rejectUnauthorized: false, // IT'S A FEATURE, NOT A BUG. PayLink developers told us to ignore certificate issues
			}),
			validateStatus: v => v === HttpStatus.OK
		}
	}
	
	async createPostTransaction(newPostTransaction: PostTransactionRequest): Promise<PostTransactionResponse> {
		this.logger.log(`Create post transaction for refParam: ${newPostTransaction.refParam}, processingId: ${newPostTransaction.body.processingId}`)
		this.logger.debug(JSON.stringify(newPostTransaction, null, 1))
		
		const { data } = await firstValueFrom(this.httpService.post('c2aTermPayment', newPostTransaction, this.config))
		
		this.logger.log(`Created post transaction for refParam: ${newPostTransaction.refParam}, processingId: ${newPostTransaction.body.processingId}`)
		this.logger.debug(JSON.stringify(data, null, 1))
		
		data.code = Number(data.code)
		
		return data
	}
	
	async getPostTransactionState(newPostTransactionStatus: PostTransactionStatusRequest): Promise<PostTransactionStatusResponse> {
		this.logger.log(`Get post transaction status for refParam: ${newPostTransactionStatus.refParam}, actId: ${newPostTransactionStatus.body.actId}`)
		this.logger.debug(JSON.stringify(newPostTransactionStatus, null, 1))
		
		const { data } = await firstValueFrom(this.httpService.post('c2aTermCheck', newPostTransactionStatus, this.config))
		
		this.logger.log(`Got post transaction status for refParam: ${newPostTransactionStatus.refParam}, actId: ${newPostTransactionStatus.body.actId}`)
		this.logger.debug(JSON.stringify(data, null, 1))
		
		let actionTime
		
		if (data.body?.actionTime) {
			const [date, time] = data.body.actionTime.split(' ')
			const [day, month, year] = date.split('.').map(v => Number(v))
			const [hour, minute, second] = time.split(':').map(v => Number(v))
			try {
				const zonedTime = Temporal.ZonedDateTime.from({ timeZone: 'Europe/Kyiv', year, month, day, hour, minute, second },
					{ overflow: 'reject' })
				actionTime = new Date(zonedTime.epochMilliseconds)
			} catch {
				throw new Error(`Cannot parse value of actionTime: ${data.body.actionTime}`)
			}
		}
		
		return new PostTransactionStatusResponse({
			...data,
			code: Number(data.code),
			body: {
				...data.body,
				actionTime
			}
		})
	}
}