import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { RefundOrderStatus } from '../enumerations'
import { Payment } from './payment'

@Entity('refund_orders')
export class RefundOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'refund_order_id' })
  id: string

  @Column('varchar', { name: 'refund_order_numb', length: 10, unique: true })
  numb: string
  
  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment
  
  @Column('uuid', { name: 'payment_id', nullable: true })
  paymentId?: string
  
  @Column('varchar', { name: 'return_url', length: 200, nullable: true })
  returnUrl?: string
  
  @Column('varchar', { name: 'notify_url', length: 200, nullable: true })
  notifyUrl?: string
  
  @Column('varchar', { name: 'refund_reason', length: 200 })
  reason: string
  
  @Column('int2', { name: 'status', default: RefundOrderStatus['нове звернення'] })
  status: RefundOrderStatus
  
  @Column('varchar', { name: 'note', length: 250, nullable: true })
  note?: string
  
  @Column('varchar', { name: 'payer_name', length: 100 })
  payerName: string
  
  @Column('varchar', { name: 'payer_edrpou', length: 10 })
  payerEdrpou: string

  @Column('numeric', {
    precision: 12,
    scale: 0,
    name: 'payer_phone',
    transformer: {
      to: v => v,
      from: v => Number(v),
    },
    nullable: true,
  })
  payerPhone?: number
  
  @Column('varchar', { name: 'payer_email', length: 100 })
  payerEmail: string

  @Column('date', { name: 'payment_date' })
  paymentDate: string
  
  @Column('varchar', { name: 'case_numb', length: 100, nullable: true })
  caseNumb?: string

  @Column('varchar', { name: 'court_code', length: 25 })
  courtCode: string
  
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'amount',
    transformer: {
      to: v => v.toFixed(2),
      from: v => Number(v),
    },
    nullable: true,
  })
  amount?: number
  
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'amount_and_fee',
    transformer: {
      to: v => v.toFixed(2),
      from: v => Number(v),
    },
  })
  amountAndFee: number
  
  @Column('boolean', { name: 'payer_notified' })
  isPayerNotified: boolean
  
  @Column('timestamptz', { name: 'payer_notify_start_at', nullable: true })
  payerNotifyStartAt?: Date
  
  @Column('timestamptz', { name: 'payer_notify_retry_at', nullable: true })
  payerNotifyRetryAt?: Date
  
  @Column('int4', { name: 'payer_notify_attempts', default: 0 })
  payerNotifyAttempts = 0
  
  @Column('varchar', { name: 'payer_notify_error' })
  payerNotifyError: string
  
  @CreateDateColumn({ name: 'create_date' })
  createDate: Date
  
  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date
}