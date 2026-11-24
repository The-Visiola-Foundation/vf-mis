import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { StatsService } from './stats.service';
import { Public } from 'src/auth/decorators/public.decorator';

const STAFF_AND_BOARD = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF, UserRole.BOARD];

@Public()
@ApiTags('Stats')
@Controller('stats')
@UseGuards(RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Roles(...STAFF_AND_BOARD)
  @ApiOperation({ summary: 'Get overview metrics for the MIS dashboard' })
  @ApiResponse({ status: 200, description: 'Overview statistics returned.' })
  @Get('overview')
  getOverview() {
    return this.statsService.getOverview();
  }

  @Roles(...STAFF_AND_BOARD)
  @ApiOperation({ summary: 'Get yearly reach and program reach statistics' })
  @ApiResponse({ status: 200, description: 'Reach statistics returned.' })
  @Get('reach')
  getReach(@Query('year') year?: number) {
    return this.statsService.getReach(year);
  }

  @Roles(...STAFF_AND_BOARD)
  @ApiOperation({ summary: 'Diagnose participation count mismatches' })
  @ApiResponse({ status: 200, description: 'Participation diagnosis returned.' })
  @Get('diagnosis')
  getDiagnosis() {
    return this.statsService.diagnoseParticipationCounts();
  }

  @Roles(...STAFF_AND_BOARD)
  @ApiOperation({ summary: 'Get unclassified students for review' })
  @ApiResponse({ status: 200, description: 'Unclassified students returned.' })
  @Get('unclassified')
  getUnclassified() {
    return this.statsService.getUnclassifiedStudents();
  }


  @Get('board')
  @Roles(...STAFF_AND_BOARD)
  @ApiOperation({ summary: 'Get program statistics for board members' })
  @ApiResponse({ status: 200, description: 'Program statistics returned.' })
  getProgramStats(@Query('year') year?: number) {
    return this.statsService.getBoardStats(year);
  }
}
