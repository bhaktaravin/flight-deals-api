import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../../redis/redis.module';
import { AmadeusProvider } from './amadeus.provider';
import { AmadeusAuthService } from './amadeus-auth.service';
import { AmadeusTransformService } from './amadeus-transform.service';

@Module({
  imports: [HttpModule, RedisModule],
  providers: [AmadeusProvider, AmadeusAuthService, AmadeusTransformService],
  exports: [AmadeusProvider, AmadeusAuthService],
})
export class AmadeusModule {}
