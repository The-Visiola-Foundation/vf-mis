
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { ScParticipationService } from './sc-participation.service';
import {
  CreateImpactMetricDto,
  CreateScParticipationDto,
} from './dto/create-sc-participation.dto';
import {
  UpdateImpactMetricDto,
  UpdateScParticipationDto,
} from './dto/update-sc-participation.dto';

const STAFF = [
  UserRole.ADMIN,
  UserRole.KEY_STAFF,
  UserRole.PROGRAMME_STAFF,
];

@Public()
@ApiTags('SC Participation')
@Controller('sc-participation')
@UseGuards(RolesGuard)
export class ScParticipationController {
  constructor(
    private readonly scParticipationService: ScParticipationService,
  ) {}

  // ==========================================
  // SC PARTICIPATION ROUTES
  // ==========================================

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create SC participation record' })
  @ApiBody({ type: CreateScParticipationDto })
  @ApiResponse({ status: 201, description: 'Participation record created.' })
  create(@Body() dto: CreateScParticipationDto) {
    return this.scParticipationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all SC participation records' })
  @ApiResponse({ status: 200, description: 'Participation records returned.' })
  findAll(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.scParticipationService.findAll(year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one SC participation record by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Participation record returned.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scParticipationService.findOne(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an SC participation record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateScParticipationDto })
  @ApiResponse({ status: 200, description: 'Participation record updated.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScParticipationDto,
  ) {
    return this.scParticipationService.update(id, dto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an SC participation record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Participation record deleted.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.scParticipationService.remove(id);
  }

  // ==========================================
  // IMPACT METRIC ROUTES
  // ==========================================

  @WriteProtected()
  @Roles(...STAFF)
  @Post('metric')
  @ApiOperation({ summary: 'Create an impact metric' })
  @ApiBody({ type: CreateImpactMetricDto })
  addMetric(@Body() dto: CreateImpactMetricDto) {
    return this.scParticipationService.addMetric(dto);
  }

  @Get('metric/:id')
  @ApiOperation({ summary: 'Get an impact metric by ID' })
  @ApiParam({ name: 'id', type: Number })
  getMetric(@Param('id', ParseIntPipe) id: number) {
    return this.scParticipationService.getMetric(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch('metric/:id')
  @ApiOperation({ summary: 'Update an impact metric' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateImpactMetricDto })
  editMetric(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImpactMetricDto,
  ) {
    return this.scParticipationService.editMetric(id, dto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete('metric/:id')
  @ApiOperation({ summary: 'Delete an impact metric by ID' })
  @ApiParam({ name: 'id', type: Number })
  deleteMetric(@Param('id', ParseIntPipe) id: number) {
    return this.scParticipationService.deleteSingleMetric(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete('metric')
  @ApiOperation({ summary: 'Delete all impact metrics' })
  deleteAllMetrics() {
    return this.scParticipationService.deleteMetric();
  }
}
