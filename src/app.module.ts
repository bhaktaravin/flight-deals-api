import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './search/search.module';
import { ProvidersModule } from './providers/providers.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';



@Module({
  imports: [SearchModule, PrismaModule, ProvidersModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
