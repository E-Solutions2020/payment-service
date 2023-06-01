import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PanError, SavePanError } from '../entities'

@Injectable()
export class PanErrorRepo {
  private readonly dbNameByPropertyName: { [key in keyof PanError]: string }
  
  constructor(
    @InjectRepository(PanError)
    private readonly panErrorRepo: Repository<PanError>,
  ) {
    this.dbNameByPropertyName = panErrorRepo.metadata.columns
      .reduce((map, column) =>
        ({ ...map, [column.propertyName]: column.databaseName }), {}) as { [key in keyof PanError]: string }
  }
  
  public async save(data: SavePanError): Promise<PanError> {
    const { pan } = data
    
    const panError = await this.panErrorRepo.findOne({ where: { pan } })
    
    if (panError) {
      await this.panErrorRepo.update({ pan }, data)
    } else {
      await this.panErrorRepo.insert(data)
    }

    return this.panErrorRepo.findOne({ where: { pan } })
  }
}
