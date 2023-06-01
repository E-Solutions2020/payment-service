import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { NotificationClient } from './notification-client.service'

@Module({
  imports: [HttpModule],
  providers: [NotificationClient],
  exports: [NotificationClient],
})
export class NotificationClientModule {}