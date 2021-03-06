import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import fetch from 'node-fetch';

import { CacheService } from '../cache.service';
import { GUARDIAN_API_URL } from '../contants';

@Injectable()
export class FeedService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async getAllSections() {
    const cachedList = await this.cacheService.getSectionList();
    if (cachedList) return cachedList;

    const response = await fetch(
      `${GUARDIAN_API_URL}/sections?api-key=${this.configService.get(
        'GUARDIAN_API_KEY',
      )}`,
    );

    if (response.status !== HttpStatus.OK)
      throw new InternalServerErrorException(
        'Unable to fetch the valid sections list from guardians api. Please try again later or contact the developer!',
      );

    const data = (await response.json()) as SectionResponse;
    if (data.response.status !== 'ok')
      throw new InternalServerErrorException(
        'Unable to fetch data from guardians api. Please try again later or contact the developer!',
      );

    const list: Section[] = data.response.results
      .filter((item) => !item.id.includes('/'))
      .map((item) => ({
        id: item.id,
        title: item.webTitle,
      }));

    await this.cacheService.setSectionList(list);

    return list;
  }

  async generateFeedForSection(section: string) {
    const articles = await this.getArticlesForSection(section);
    return this.generateFeedFromArticles(articles);
  }

  private async getArticlesForSection(section: string) {
    const cachedList = await this.cacheService.getArticlesForSection(section);
    if (cachedList) return cachedList;

    const fetchedData = await this.fetchArticlesForSection(section);
    await this.cacheService.setArticlesForSection(section, fetchedData);

    return fetchedData;
  }

  private async fetchArticlesForSection(section: string) {
    const response = await fetch(
      `${GUARDIAN_API_URL}/${section}?api-key=${this.configService.get(
        'GUARDIAN_API_KEY',
      )}`,
    );
    if (response.status === HttpStatus.NOT_FOUND)
      throw new NotFoundException(
        'Unable to find the specified section. Check /feed to know about the possible sections',
      );
    else if (response.status !== HttpStatus.OK)
      throw new InternalServerErrorException(
        'Unable to fetch data from guardians api. Please try again later or contact the developer!',
      );

    const data = (await response.json()) as ArticleResponse;
    if (data.response.status !== 'ok')
      throw new InternalServerErrorException(
        'Unable to fetch data from guardians api. Please try again later or contact the developer!',
      );

    return data.response.results;
  }

  private generateFeedFromArticles(articles: Article[]) {
    const itemElements = articles
      .map(
        (post) =>
          `
        <item>
          <title>${this.cleanText(post.webTitle)}</title>
          <link>${post.webUrl}</link>
          <guid>${post.webUrl}</guid>
          <pubDate>${new Date(post.webPublicationDate).toUTCString()}</pubDate>
          <category>${post.sectionName}</category>
        </item>
        `,
      )
      .join('');

    const { sectionId, sectionName } = articles[0];

    const rssFeed = `
      <rss version="2.0">
        <channel>
          <title>The Guardian - ${sectionName}</title>
          <link>https://www.theguardian.com/${sectionId}</link>
          <description>${sectionName} news on UK and world from the Guardian, the world's leading liberal voice</description>
          <language>en</language>
          <copyright>Copyright 2021 Guardian News and Media Limited or its affiliated companies</copyright>
          <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
          ${itemElements}
        </channel>
      </rss>
    `;
    return rssFeed;
  }

  private cleanText(input: string) {
    return input.replace(/&/g, 'and');
  }
}

export interface Section {
  id: string;
  title: string;
}

interface SectionResponse {
  response: {
    status: string;
    total: number;
    results: {
      id: string;
      webTitle: string;
    }[];
  };
}

interface ArticleResponse {
  response: {
    status: string;
    total: number;
    pageSize: number;
    results: Article[];
  };
}

export interface Article {
  id: string;
  type: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  isHosted: boolean;
}
