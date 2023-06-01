import { Module, ConfigurableModuleBuilder } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { PostTransactionClient } from './post-transaction-client.service'
import { PostTransactionClientOptions } from './post-transaction-client.options'

@Module({
  imports: [HttpModule],
  providers: [PostTransactionClient],
  exports: [PostTransactionClient],
})
export class PostTransactionClientModule extends (new ConfigurableModuleBuilder<PostTransactionClientOptions>({
  optionsInjectionToken: PostTransactionClientOptions as any }).build().ConfigurableModuleClass) {}