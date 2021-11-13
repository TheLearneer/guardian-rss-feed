import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { CacheService } from '../cache.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService, CacheService],
})
export class FeedModule {}
