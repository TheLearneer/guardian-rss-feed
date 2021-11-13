import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { Article, Section } from './feed/feed.service';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public getSectionList() {
    return this.cacheManager.get<Section[]>('SECTION_LIST');
  }

  public setSectionList(sections: Section[]) {
    return this.cacheManager.set('SECTION_LIST', sections, { ttl: 10 * 60 });
  }

  public getArticlesForSection(section: string) {
    return this.cacheManager.get<Article[]>(`section-${section}`);
  }

  public setArticlesForSection(section: string, articles: Article[]) {
    return this.cacheManager.set(`section-${section}`, articles, {
      ttl: 10 * 60,
    });
  }
}
