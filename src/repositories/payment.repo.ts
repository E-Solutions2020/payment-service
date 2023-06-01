import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Raw, Repository } from 'typeorm'
import { NewPayment, Payment, UpdatePayment } from '../entities'
import { Page } from '@app/common'
import { processPage } from './helpers'
import { ConfigService } from '../config'
import { RefundStatus } from '../enumerations'

export type PaymentSearchParams = {
  createDateFrom?: Payment['createDate'],
  createDateTo?: Payment['createDate'],
  description?: Payment['description'],
}

@Injectable()
export class PaymentRepo {
  private readonly dbNameByPropertyName: { [key in keyof Payment]: string }
  
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {
    this.dbNameByPropertyName = paymentRepo.metadata.columns
      .reduce((map, column) =>
        ({ ...map, [column.propertyName]: column.databaseName }), {}) as { [key in keyof Payment]: string }
  }
  
  public async create(data: NewPayment): Promise<Payment> {
    const { identifiers: [id] } = await this.paymentRepo.insert(data)
    return this.paymentRepo.findOne({ where: id, relations: ['feeType'] })
  }
  
  public async update(id: Payment['id'], data: UpdatePayment): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } })
  
    if (!payment) {
      throw new Error(`Payment by id ${id} not found`)
    }
  
    await this.paymentRepo.update(id, data)
    
    return this.findById(id)
  }
  
  public findById(id: Payment['id']): Promise<Payment> {
    return this.paymentRepo.findOne({ where: { id }, relations: ['feeType'] })
  }

  public findByTransactionId(transactionId: Payment['transactionId']): Promise<Payment> {
    return this.paymentRepo.findOne({ where: { transactionId }, relations: ['feeType'] })
  }

  public findBySid(sid: Payment['sid']): Promise<Payment> {
    return this.paymentRepo.findOne({ where: { sid }, relations: ['feeType'] })
  }
  
  public find(params: PaymentSearchParams = {}, page: Page): Promise<Payment[]> {
    const where = this.processSearchParams(params)
    const order = { createDate: 'ASC' as const }
    return this.paymentRepo.find({ where, order, ...processPage(page), relations: ['feeType'] })
  }
  
  public findNotFinished(page: Page): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {
      isFailed: false,
      isFinished: false,
      statusUpdateRetryAt: Raw(alias => `(${alias} IS NULL OR ${alias} <= now())`),
    }
    return this.paymentRepo.find({ where, ...processPage(page), order: { updateDate: 'ASC' }, relations: ['feeType'] })
  }
  
  public findAbsNotFinished(page: Page): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {
      isFinished: true,
      isAbsFinished: false,
      statusUpdateRetryAt: Raw(alias => `(${alias} IS NULL OR ${alias} <= now())`),
    }
  
    const { giveUpAfterDays } = this.config.paymentStatusUpdate
  
    if (giveUpAfterDays) {
      where.statusUpdateStartAt = Raw(alias => `(${alias} IS NULL OR ${alias} >= now() - interval '${giveUpAfterDays} day')`)
    }
    
    return this.paymentRepo.find({ where, ...processPage(page), order: { updateDate: 'ASC' }, relations: ['feeType'] })
  }
  
  public findNotNotified(page: Page): Promise<Payment[]> {
    const { isFailed, isFinished, refundStatus } = this.dbNameByPropertyName
    
    const where: FindOptionsWhere<Payment> = {
      status: Raw(() => `(${isFailed} OR ${isFinished} OR ${refundStatus} = '${RefundStatus.finished}')`),
      notifyUrl: Raw(alias => `${alias} IS NOT NULL`),
      isNotified: false,
      notifyRetryAt: Raw(alias => `(${alias} IS NULL OR ${alias} <= now())`),
    }
  
    const { giveUpAfterDays } = this.config.notification
  
    if (giveUpAfterDays) {
      where.notifyStartAt = Raw(alias => `(${alias} IS NULL OR ${alias} >= now() - interval '${giveUpAfterDays} day')`)
    }
    
    return this.paymentRepo.find({ where, ...processPage(page), order: { updateDate: 'ASC' }, relations: ['feeType'] })
  }
  
  public findRefunding(page: Page): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {
      refundStatus: RefundStatus.started,
      statusUpdateRetryAt: Raw(alias => `(${alias} IS NULL OR ${alias} <= now())`),
    }
  
    const { giveUpAfterDays } = this.config.paymentStatusUpdate
  
    if (giveUpAfterDays) {
      where.statusUpdateStartAt = Raw(alias => `(${alias} IS NULL OR ${alias} >= now() - interval '${giveUpAfterDays} day')`)
    }
  
    return this.paymentRepo.find({ where, ...processPage(page), order: { updateDate: 'ASC' }, relations: ['feeType'] })
  }
  
  private processSearchParams(params: PaymentSearchParams = {}): FindOptionsWhere<Payment> {
    const { createDateFrom, createDateTo, description } = params
    
    const where: FindOptionsWhere<Payment> = {}
  
    if (createDateFrom && createDateTo) {
      where.createDate = Between(createDateFrom, createDateTo)
    } else if (createDateFrom) {
      where.createDate = MoreThanOrEqual(createDateFrom)
    } else if (createDateTo) {
      where.createDate = LessThanOrEqual(createDateTo)
    }
    
    if (description !== undefined) {
      where.description = ILike(`%${description}%`)
    }
    
    return where
  }
}
