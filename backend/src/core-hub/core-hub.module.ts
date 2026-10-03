import { Module } from '@nestjs/common';
import { CoreHubClient } from './core-hub.client';
import { PeopleService } from './people.service';

@Module({
  providers: [CoreHubClient, PeopleService],
  exports: [CoreHubClient, PeopleService],
})
export class CoreHubModule {}
