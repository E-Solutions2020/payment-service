import { ArgumentMetadata, Injectable, ParseUUIDPipe } from '@nestjs/common'

@Injectable()
export class UuidValidationPipe extends ParseUUIDPipe {
  constructor(private readonly options: { required: boolean } = { required: true }) {
    super()
  }

  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    if (!value && !this.options.required) {
      return undefined
    }

    return await super.transform(value, metadata)
  }
}
