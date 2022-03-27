import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Board } from '../board/entities/board.entity';
import { HASHTAG, Schedule } from '../schedule/entities/schedule.entity';
import { ShareScheduleService } from './sharedList.service';
import { Cache } from 'cache-manager';
import { ScheduleService } from '../schedule/schedule.service';

@Resolver()
export class ShareScheduleResolver {
  constructor(
    private readonly shareScheduleService: ShareScheduleService, //
    private readonly scheduleService: ScheduleService,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  //족보 리스트 조회
  @Query(() => [Schedule])
  async fetchShareSchedules(
    @Args('page', { defaultValue: 1 }) page: number, //
  ) {
    return await this.shareScheduleService.findMyQtList({ page });
  }

  // 족보 조회
  @Query(() => [Board])
  async fetchBoard(
    @Args('scheduleId') scheduleId: string, //
  ) {
    return await this.shareScheduleService.findMyQtBoard({ scheduleId });
  }

  //지도 + 검색
  @Query(() => [Schedule])
  async scheduleSearch(
    @Args('search') search: string,
    @Args('where') where: string,
  ) {
    // const list = await this.cacheManager.get(`${search}`);
    // if (list) {
    //   return list;
    // } else {
    // await this.scheduleService.findLocation({ where });

    const map = await this.scheduleService.findLocation({ where });

    const result = await this.elasticsearchService.search({
      query: {
        bool: {
          must: [
            { match: { title: search } }, //
            // { match: { location: where } }, //
          ],
        },
      },
    });
    console.log(result.hits.hits);
    const resultmap = result.hits.hits.map((ele) => {
      const obj = {};
      const resultsource = JSON.stringify(ele._source);
      const temp = JSON.parse(resultsource);
      for (let key in temp) {
        if (!key.includes('@')) obj[key] = temp[key];
      }
      return obj;
    });
    console.log('resultmap', resultmap);
    // if (resultmap.length === 0)
    //   throw new UnprocessableEntityException('해당 내용이 존재하지 않습니다.');
    // await this.cacheManager.set(`${search}`, resultmap, { ttl: 0 });
    console.log(map);
    if (map && resultmap) return resultmap;
    // return resultmap;
    // }
  }
  //지도 + 해시태그
  @Query(() => [Schedule])
  async scheduleHashTagSearch(
    @Args('where') where: string,
    @Args('hashTag') hashTag: HASHTAG,
  ) {
    return await this.scheduleService.findHashtagLocation({
      where,
      hashTag,
    });
  }
}
