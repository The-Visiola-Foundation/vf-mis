import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('Tracks')
@Controller('tracks')
@UseGuards(RolesGuard)
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a track' })
  @ApiBody({ type: CreateTrackDto })
  @ApiResponse({ status: 201, description: 'Track created.' })
  create(@Body() createTrackDto: CreateTrackDto) {
    return this.tracksService.create(createTrackDto);
  }

  @WriteProtected()
  @Post('batch')
  @ApiOperation({ summary: 'Create multiple tracks' })
  @ApiBody({ type: [CreateTrackDto] })
  @ApiResponse({ status: 201, description: 'Tracks created.' })
  createBatch(@Body() createTrackDtos: CreateTrackDto[]) {
    return this.tracksService.createMany(createTrackDtos);
  }

  @Get()
  @ApiOperation({ summary: 'List all tracks' })
  @ApiResponse({ status: 200, description: 'Tracks returned.' })
  findAll() {
    return this.tracksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one track by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Track id' })
  @ApiResponse({ status: 200, description: 'Track returned.' })
  findOne(@Param('id') id: string) {
    return this.tracksService.findOne(+id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a track' })
  @ApiParam({ name: 'id', type: Number, description: 'Track id' })
  @ApiBody({ type: UpdateTrackDto })
  @ApiResponse({ status: 200, description: 'Track updated.' })
  update(@Param('id') id: string, @Body() updateTrackDto: UpdateTrackDto) {
    return this.tracksService.update(+id, updateTrackDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a track' })
  @ApiParam({ name: 'id', type: Number, description: 'Track id' })
  @ApiResponse({ status: 200, description: 'Track deleted.' })
  remove(@Param('id') id: string) {
    return this.tracksService.remove(+id);
  }
}
