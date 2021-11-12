import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import fetch from 'node-fetch';

import { GUARDIAN_API_URL } from '../contants';

@Injectable()
export class FeedService {
  constructor(private readonly configService: ConfigService) {}

  async getAllSections() {
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

    return data.response.results
      .filter((item) => !item.id.includes('/'))
      .map((item) => ({
        id: item.id,
        title: item.webTitle,
      }));
  }
}

export interface SectionResponse {
  response: {
    status: string;
    total: number;
    results: {
      id: string;
      webTitle: string;
    }[];
  };
}
