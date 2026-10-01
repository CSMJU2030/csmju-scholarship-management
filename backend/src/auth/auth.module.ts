import { Module } from '@nestjs/common';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { JwksService } from './jwks.service';
import { MeController } from './me.controller';
import { SsoCallbackController } from './sso-callback.controller';

@Module({
  imports: [CoreHubModule],
  controllers: [SsoCallbackController, MeController],
  providers: [JwksService, CoreHubTokenVerifier],
  exports: [JwksService, CoreHubTokenVerifier],
})
export class AuthModule {}
