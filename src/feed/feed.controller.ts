import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Response,
} from '@nestjs/common';
import { Response as Resp } from 'express';

import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getAllSections() {
    return this.feedService.getAllSections();
  }

  @Get(':section')
  async getRssFeed(@Param('section') section: string, @Response() res: Resp) {
    const isInputValid = /^[a-z]+(-?)[a-z]+$/gm.test(section);
    if (!isInputValid)
      throw new BadRequestException(
        'Section name can include only lowercase letters and hyphens in proper format! e.g. business-to-business',
      );

    const feedContent = await this.feedService.generateFeedForSection(section);

    res.set('Content-Type', 'application/xml');
    res.end(feedContent);
  }
}
