import { Module, ConfigurableModuleBuilder } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { PayLinkClient } from './pay-link-client.service'
import { PayLinkClientOptions } from './pay-link-client.options'

@Module({
  imports: [HttpModule],
  providers: [PayLinkClient],
  exports: [PayLinkClient],
})
export class PayLinkClientModule extends (new ConfigurableModuleBuilder<PayLinkClientOptions>({
  optionsInjectionToken: PayLinkClientOptions as any }).build().ConfigurableModuleClass) {}