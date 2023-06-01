import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Raw, Repository } from 'typeorm'
import { NewRefundOrder, RefundOrder, UpdateRefundOrder } from '../entities'
import { Page } from '@app/common'
import { processPage } from './helpers'
import { ConfigService } from '../config'

export type RefundOrderSearchParams = {
  createDateFrom?: RefundOrder['createDate'],
  createDateTo?: RefundOrder['createDate'],
  status?: RefundOrder['status'],
  payerName?: RefundOrder['payerName'],
  payerEdrpou?: RefundOrder['payerEdrpou'],
  caseNumb?: RefundOrder['caseNumb'],
  courtCode?: RefundOrder['courtCode'],
  amount?: RefundOrder['amount'],
  amountAndFee?: RefundOrder['amountAndFee'],
}

@Injectable()
export class RefundOrderRepo {
  private readonly dbNameByPropertyName: { [key in keyof RefundOrder]: string }
  
  constructor(
    @InjectRepository(RefundOrder)
    private readonly refundOrderRepo: Repository<RefundOrder>,
    private readonly config: ConfigService,
  ) {
    this.dbNameByPropertyName = refundOrderRepo.metadata.columns
      .reduce((map, column) =>
        ({ ...map, [column.propertyName]: column.databaseName }), {}) as { [key in keyof RefundOrder]: string }
  }
  
  public async create(data: NewRefundOrder): Promise<RefundOrder> {
    const { identifiers: [id] } = await this.refundOrderRepo.insert(data)
    return this.refundOrderRepo.findOne({ where: id })
  }
  
  public find(params: RefundOrderSearchParams = {}, page: Page): Promise<RefundOrder[]> {
    const where = this.processSearchParams(params)
    const order = { createDate: 'ASC' as const }
    return this.refundOrderRepo.find({ where, order, ...processPage(page) })
  }
  
  public findById(id: RefundOrder['id']): Promise<RefundOrder> {
    return this.refundOrderRepo.findOne({ where: { id } })
  }
  
  public findByNumb(numb: RefundOrder['numb']): Promise<RefundOrder> {
    return this.refundOrderRepo.findOne({ where: { numb } })
  }
  
  public findNotNotifiedPayer(page: Page): Promise<RefundOrder[]> {
    const where: FindOptionsWhere<RefundOrder> = {
      isPayerNotified: false,
      payerNotifyRetryAt: Raw(alias => `(${alias} IS NULL OR ${alias} <= now())`),
    }
    
    const { giveUpAfterDays } = this.config.notification
    
    if (giveUpAfterDays) {
      where.payerNotifyStartAt = Raw(alias => `(${alias} IS NULL OR ${alias} >= now() - interval '${giveUpAfterDays} day')`)
    }
    
    return this.refundOrderRepo.find({ where, ...processPage(page), order: { updateDate: 'ASC' } })
  }
  
  public async update(id: RefundOrder['id'], data: UpdateRefundOrder): Promise<RefundOrder> {
    const refundOrder = await this.refundOrderRepo.findOne({ where: { id } })
    
    if (!refundOrder) {
      throw new Error(`Refund order by id ${id} not found`)
    }
    
    await this.refundOrderRepo.update(id, data)
    
    return this.findById(id)
  }
  
  private processSearchParams(params: RefundOrderSearchParams = {}): FindOptionsWhere<RefundOrder> {
    const {
      createDateFrom,
      createDateTo,
      status,
      payerName,
      payerEdrpou,
      caseNumb,
      courtCode,
      amount,
      amountAndFee,
    } = params
    
    const where: FindOptionsWhere<RefundOrder> = {}
    
    if (createDateFrom && createDateTo) {
      where.createDate = Between(createDateFrom, createDateTo)
    } else if (createDateFrom) {
      where.createDate = MoreThanOrEqual(createDateFrom)
    } else if (createDateTo) {
      where.createDate = LessThanOrEqual(createDateTo)
    }
    
    if (status) {
      where.status = status
    }
    
    if (payerName !== undefined) {
      where.payerName = ILike(`%${payerName}%`)
    }
    
    if (payerEdrpou) {
      where.payerEdrpou = payerEdrpou
    }
    
    if (caseNumb) {
      where.caseNumb = caseNumb
    }
    
    if (courtCode) {
      where.courtCode = courtCode
    }

    if (amount) {
      where.amount = amount
    }

    if (amountAndFee) {
      where.amountAndFee = amountAndFee
    }
    
    return where
  }
}
