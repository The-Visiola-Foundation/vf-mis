import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { ScService } from './sc.service';
import { ScRollupService } from './sc-rollup.service';
import { ScResultsService } from './sc-results.service';
import { CreateCampDto } from './dto/create-camp.dto';
import { UpsertResultsDto } from './dto/upsert-results.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];
const STAFF_AND_BOARD = [
  UserRole.ADMIN,
  UserRole.KEY_STAFF,
  UserRole.PROGRAMME_STAFF,
  UserRole.BOARD,
];

@ApiTags('SC')
@Public()
@Controller('sc')
@UseGuards(RolesGuard)
export class ScController {
  constructor(
    private readonly scService: ScService,
    private readonly rollupService: ScRollupService,
    private readonly resultsService: ScResultsService,
  ) {}

  @Get('camps')
  @ApiOperation({ summary: 'List camps for the selector' })
  @ApiResponse({ status: 200, description: 'Camps returned.' })
  findAllCamps() {
    return this.scService.listCamps();
  }

  @Get('years/:year/rollup')
  @Roles(...STAFF_AND_BOARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Both-camps view for a year' })
  @ApiParam({ name: 'year', type: Number })
  getYearRollup(@Param('year', ParseIntPipe) year: number) {
    return this.rollupService.getYearRollup(year);
  }

  @Get('compare')
  @Roles(...STAFF_AND_BOARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'A core measure across camps' })
  @ApiQuery({ name: 'core', type: String })
  getCompare(@Query('core') core: string) {
    return this.rollupService.getCompare(core);
  }

  @Get('camps/:campId/impact')
  @ApiOperation({ summary: 'One payload for the dashboard STEM Camps page' })
  @ApiParam({ name: 'campId', example: '2026-SUMMER' })
  getImpact(@Param('campId') campId: string) {
    return this.scService.getImpact(campId);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Post('camps')
  @ApiOperation({ summary: 'Create a camp' })
  @ApiBody({ type: CreateCampDto })
  @ApiResponse({ status: 201, description: 'Camp created.' })
  createCamp(@Body() dto: CreateCampDto) {
    return this.scService.createCamp(dto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Put('camps/:campId/results')
  @ApiOperation({ summary: 'Bulk upsert of measures and results' })
  @ApiParam({ name: 'campId', example: '2026-SUMMER' })
  @ApiBody({ type: UpsertResultsDto })
  upsertResults(
    @Param('campId') campId: string,
    @Body() dto: UpsertResultsDto,
  ) {
    return this.resultsService.bulkUpsertResults({ ...dto, campId });
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Post('camps/:campId/import')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Raw score CSV import (later step)' })
  @ApiParam({ name: 'campId', example: '2026-SUMMER' })
  importCsv() {
    return {
      statusCode: HttpStatus.NOT_IMPLEMENTED,
      message: 'CSV import is not implemented yet',
    };
  }
}
