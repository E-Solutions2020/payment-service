import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Fee } from './fee'
import { PENDING_PAY_LINK_STATUSES } from '@app/pay-link-client'
import {
  FINISHED_POST_TRANSACTION_ACTION_STATUSES,
  PostTransactionActionStatus,
} from '@app/post-transaction-client/enums'
import { RefundStatus } from '../enumerations'

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  id: string
  
  @Column('varchar', { name: 'auth_client_id', length: 256 })
  authClientId: string
  
  @Column('varchar', { name: 'auth_client_name', length: 256 })
  authClientName: string
  
  @Column('text', { name: 'order_id' })
  orderId: string
  
  @Column('varchar', { name: 'sid', length: 200 })
  sid: string
  
  @Column('uuid', { name: 'transaction_id' })
  transactionId: string
 
  @Column('varchar', { name: 'currency', length: 3 })
  currency: string
  
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'amount',
    transformer: {
      to: v => v.toFixed(2),
      from: v => Number(v),
    },
  })
  amount: number
  
  @ManyToOne(() => Fee)
  @JoinColumn({ name: 'fee_id' })
  feeType: Fee

  @Column('uuid', { name: 'fee_id' })
  feeTypeId: string
  
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'fee',
    nullable: true,
    transformer: {
      to: v => v.toFixed(2),
      from: v => Number(v),
    },
  })
  fee?: number
  
  @Column('varchar', { name: 'recipient_iban', length: 34 })
  recipientIban: string

  @Column('varchar', { name: 'recipient_name', length: 500 })
  recipientName: string

  @Column('varchar', { name: 'recipient_edrpou', length: 10 })
  recipientEdrpou: string

  @Column('varchar', { name: 'recipient_mfo', length: 10 })
  recipientMfo: string

  @Column('varchar', { name: 'recipient_bank', length: 200 })
  recipientBank: string

  @Column('varchar', { name: 'payer_name', length: 100, nullable: true })
  payer: string

  @Column('varchar', { name: 'description', length: 500 })
  description: string
  
  @Column('boolean', { name: 'started_pay' })
  startedPay: boolean

  @Column('boolean', { name: 'details_changed' })
  detailsChanged: boolean
  
  @Column('int2', { name: 'abs_status', nullable: true })
  absStatus?: number
  
  @Column('int2', { name: 'status', nullable: true })
  status?: number
  
  @Column('timestamptz', { name: 'status_update_start_at', nullable: true })
  statusUpdateStartAt: Date
  
  @Column('timestamptz', { name: 'status_update_retry_at', nullable: true })
  statusUpdateRetryAt: Date
  
  @Column('int4', { name: 'status_update_attempts', default: 0 })
  statusUpdateAttempts = 0
  
  @Column('int4', { name: 'abs_action_id', nullable: true })
  absActionId?: number
  
  @Column('text', { name: 'abs_action_status', nullable: true })
  absActionStatus?: string

  @Column('timestamptz', { name: 'abs_action_time', nullable: true })
  absActionTime?: Date
  
  @Column('varchar', { name: 'processing_id', length: 3, nullable: true })
  processingId?: string
  
  @CreateDateColumn({ name: 'create_date' })
  createDate: Date

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date
  
  @Column('timestamptz', { name: 'finish_date', nullable: true })
  finishDate?: Date

  @Column('timestamptz', { name: 'finish_abs_date', nullable: true })
  finishAbsDate?: Date

  @Column('varchar', { name: 'notify_url', length: 200, nullable: true })
  notifyUrl?: string
  
  @Column('boolean', { name: 'notified' })
  isNotified: boolean
  
  @Column('timestamptz', { name: 'notify_start_at', nullable: true })
  notifyStartAt?: Date

  @Column('timestamptz', { name: 'notify_retry_at', nullable: true })
  notifyRetryAt?: Date
  
  @Column('int4', { name: 'notify_attempts', default: 0 })
  notifyAttempts = 0

  @Column('varchar', { name: 'notify_error' })
  notifyError: string
  
  @Column('boolean', { name: 'expired' })
  isExpired: boolean

  @Column('boolean', { name: 'failed' })
  isFailed: boolean

  @Column('boolean', { name: 'finished' })
  isFinished: boolean

  @Column('boolean', { name: 'abs_failed' })
  isAbsFailed: boolean

  @Column('boolean', { name: 'abs_finished' })
  isAbsFinished: boolean
  
  @Column('enum', { name: 'refund_status', enum: RefundStatus, nullable: true })
  refundStatus?: RefundStatus

  @Column('int2', { name: 'refund_status_code', nullable: true })
  refundStatusCode?: number

  @Column('varchar', { name: 'refund_status_message', nullable: true })
  refundStatusMessage?: string
  
  @Column('float4', { name: 'refund_amount', nullable: true })
  refundAmount: number
  
  @Column('text', { name: 'status_message' })
  statusMessage: string
  
  @Column('varchar', { name: 'pan', length: 6, nullable: true })
  pan?: string
  
  get isPayLinkPending() {
    return !this.isExpired && PENDING_PAY_LINK_STATUSES.includes(this.status)
  }
  
  get isPostTransactionPending() {
    return !FINISHED_POST_TRANSACTION_ACTION_STATUSES.includes(this.absActionStatus as PostTransactionActionStatus)
  }
}