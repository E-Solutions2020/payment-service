import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { NewSessionDto } from '../dto'
import { PayLinkClient } from '@app/pay-link-client'
import { ConfigService } from '../config'
import { v4 as uuidv4 } from 'uuid'
import { AuthClientDetailsRepo, FeeRepo, PaymentRepo } from '../repositories'

const PAY_LINK_REQUEST_TYPE = 'getSession'
const PAY_LINK_ORDER_TYPE = '3'

@Injectable()
export class SessionService {
  constructor(private readonly payLinkClient: PayLinkClient,
              private readonly paymentRepo: PaymentRepo,
              private readonly feeRepo: FeeRepo,
              private readonly authClientDetailsRepo: AuthClientDetailsRepo,
              private readonly config: ConfigService) {
  }

  async createSession(newSessionDto: NewSessionDto): Promise<{ paymentId: string, frameUrl: string }> {
    const transactionId = uuidv4()
    const paymentId = uuidv4()
  
    const {
      callback,
      description,
      amount,
      paymentCode,
      currency,
      client,
      recipient,
      authClient,
    } = newSessionDto
  
    const [fee, authClientDetails] = await Promise.all([
      this.feeRepo.findByPaymentCode(paymentCode),
      this.authClientDetailsRepo.findByAuthClientId(authClient.id),
    ])
    
    if (!fee) {
      throw new BadRequestException(`Fee by paymentCode ${paymentCode} is not found`)
    }
    
    let feeAmount = (Math.round(Number(amount) * fee.feePercent) / 100).toFixed(2)
    
    if (fee.minFee && Number(feeAmount) < fee.minFee) {
      feeAmount = Math.round(fee.minFee).toFixed(2)
    }
    
    let callbackWithPaymentId: URL
    
    if (callback) {
      callbackWithPaymentId = new URL(newSessionDto.callback) as URL
      callbackWithPaymentId.searchParams.set('paymentId', paymentId)
    }
    
    let sessionDescription = description
    
    if (authClientDetails?.url) {
      sessionDescription += `;URL=${authClientDetails.url}`
    }
    
    const newSession = {
      callback: callbackWithPaymentId?.toString(),
      description: sessionDescription,
      amount,
      fee: feeAmount,
      currency,
      clientParams: client || { // IT'S A FEATURE, NOT A BUG. PayLink developers told to hardcode clientParams
        cardHolderName: 'Mr.Cardholder',
        billAddrCity: 'Kyiv',
        billAddrCountry: '804',
        billAddrLine3: '',
        billAddrLine2: '',
        billAddrLine1: 'test',
        billAddrPostCode: '03201',
        billAddrState: '18',
        billMobilePhone: '380501112233',
        billEmail: 'test@gmail.com',
      },
      type: PAY_LINK_REQUEST_TYPE,
      merchant: this.config.payLinkService.terminalId,
      tranid: transactionId,
      ordertype: PAY_LINK_ORDER_TYPE,
    }
    
    const newSessionResult = await this.payLinkClient.createSession(newSession)
  
    if (newSessionResult.resultCode !== '100') {
      throw new InternalServerErrorException(`Unexpected response: ${JSON.stringify(newSessionResult)}`)
    }
    
    const frameUrl = new URL(`frame/pay/?sid=${newSessionResult.sid}`, this.config.payLinkService.frontEndUrl).toString()
    
    const payment = await this.paymentRepo.create({
      id: paymentId,
      authClientId: authClient.id,
      authClientName: authClient.name,
      orderId: newSessionDto.orderId,
      sid: newSessionResult.sid,
      currency: newSessionDto.currency,
      amount: Number(amount),
      feeTypeId: fee.id,
      fee: Number(feeAmount),
      recipientIban: recipient.iban,
      recipientName: recipient.name,
      recipientEdrpou: recipient.edrpou,
      recipientMfo: recipient.mfo,
      recipientBank: recipient.bankName,
      payer: newSessionDto.payer,
      description,
      transactionId,
      notifyUrl: newSessionDto.notifyUrl
    })
    
    return {
      paymentId: payment.id,
      frameUrl,
    }
  }
}
