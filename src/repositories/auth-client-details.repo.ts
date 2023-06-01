import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuthClientDetails } from '../entities'

@Injectable()
export class AuthClientDetailsRepo {
  constructor(
    @InjectRepository(AuthClientDetails)
    private readonly clientDetailsRepo: Repository<AuthClientDetails>,
  ) {}
  
  public findByAuthClientId(authClientId: AuthClientDetails['authClientId']): Promise<AuthClientDetails> {
    return this.clientDetailsRepo.findOne({ where: { authClientId } })
  }
}
