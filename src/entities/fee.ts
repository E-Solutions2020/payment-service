import { Entity, CreateDateColumn, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('fees')
export class Fee {
  @PrimaryGeneratedColumn('uuid', { name: 'fee_id' })
  id: string
  
  @Column('varchar', { name: 'payment_code', length: 4 })
  paymentCode: string
  
  @Column('float4', { name: 'fee_percent' })
  feePercent: number
  
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'min_sum',
    nullable: true,
    transformer: {
      to: v => v.toFixed(2),
      from: v => Number(v),
    },
  })
  minFee?: number

  @Column('varchar', { name: 'description', length: 500 })
  description: string
  
  @CreateDateColumn({ name: 'create_date' })
  createDate: Date
  
  @Column('timestamptz', { name: 'finish_date', nullable: true })
  finishDate?: Date

  @Column('boolean', { name: 'deleted' })
  isDeleted: boolean
}
