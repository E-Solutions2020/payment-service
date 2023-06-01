import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { PayLinkClientOptions } from './pay-link-client.options'
import { NewSession } from './entities/new-session'
import { NewRefundRequest, NewRefundResponse, NewSessionResponse, TransactionState } from './entities'
import * as crypto from 'crypto'

@Injectable()
export class PayLinkClient {
	private readonly url: URL
	private readonly signKey: string
	private readonly logger = new Logger(PayLinkClient.name)
	
	constructor(private readonly options: PayLinkClientOptions,
	            private readonly httpService: HttpService) {
		this.url = new URL(options.url)
		this.signKey = options.signKey
	}
	
	async createSession(newSession: NewSession): Promise<NewSessionResponse> {
		const requestData = {
			...newSession,
			sign: this.signData(newSession)
		}
		
		this.logger.log(`Create session with tranid: ${newSession.tranid}`)
		this.logger.debug(JSON.stringify(requestData, null, 1))
		
		const { data } = await firstValueFrom(this.httpService.post(this.url.toString(), requestData, {
			validateStatus: status => status === HttpStatus.OK
		}))
		
		this.logger.log(`Created session with tranid: ${newSession.tranid}, sid: ${data.sid}`)
		this.logger.debug(JSON.stringify(data, null, 1))
		
		return data
	}
	
	async createRefundRequest(newRefundRequest: NewRefundRequest): Promise<NewRefundResponse> {
		const requestData = {
			...newRefundRequest,
			sign: this.signData(newRefundRequest)
		}
		
		this.logger.log(`Create refund request with sid: ${newRefundRequest.sid}`)
		this.logger.debug(JSON.stringify(requestData, null, 1))
		
		const { data } = await firstValueFrom(this.httpService.post(this.url.toString(), requestData, {
			validateStatus: status => status === HttpStatus.OK
		}))
		
		this.logger.log(`Created refund request with sid: ${newRefundRequest.sid}`)
		this.logger.debug(JSON.stringify(data, null, 1))
		
		return data
	}
	
	async getTransactionState(sid: string): Promise<TransactionState> {
		const requestData: any = { sid, type: 'getTranState' }
		
		requestData.sign = this.signData(requestData)
		
		this.logger.log(`Get transaction state by sid: ${sid}`)
		this.logger.debug(JSON.stringify(requestData, null, 1))
		
		const { data } = await firstValueFrom(this.httpService.post(this.url.toString(), requestData, {
			validateStatus: status => status === HttpStatus.OK
		}))
		
		this.logger.log(`Got transaction state by sid: ${sid}`)
		this.logger.debug(JSON.stringify(data, null, 1))
		
		return data
	}
	
	private signData(data: object): string {
		const { signKey } = this
		const dataJson = JSON.stringify(data).replace(/\//g, '\\/')
		return crypto.createHmac('sha1', signKey)
			.update(`${signKey}${Buffer.from(dataJson).toString('base64')}${signKey}`)
			.digest('base64')
	}
}