import {
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm'

@Entity('auth_client_details')
export class AuthClientDetails {
  @PrimaryColumn('varchar', { name: 'auth_client_id', length: 256 })
  authClientId: string
  
  @Column('varchar', { name: 'url', length: 256 })
  url: string
}