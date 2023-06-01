import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('pan_errors')
export class PanError {
  @PrimaryGeneratedColumn('uuid', { name: 'pan_error_id' })
  id: string
  
  @Column('varchar', { name: 'pan', length: 6, unique: true })
  pan: string
  
  @Column('int2', { name: 'status' })
  status: number
  
  @Column('varchar', { name: 'bank_name', length: 256, nullable: true })
  bankName?: string
  
  @CreateDateColumn({ name: 'create_date' })
  createDate: Date

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date
}