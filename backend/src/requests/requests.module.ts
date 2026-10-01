import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ScholarshipsModule } from '../scholarships/scholarships.module';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [LookupsModule, ScholarshipsModule, CoreHubModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
