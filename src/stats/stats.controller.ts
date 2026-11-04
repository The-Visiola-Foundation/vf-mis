import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { StatsService } from './stats.service';

@Public()
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  getOverview() {
    return this.statsService.getOverview();
  }

  @Get('reach')
  getReach() {
    return this.statsService.getReach();
  }
}
