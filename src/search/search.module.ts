import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProvidersModule } from '../providers/providers.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ProvidersModule, PrismaModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
