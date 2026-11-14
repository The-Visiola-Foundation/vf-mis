import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { ScParticipationService } from './sc-participation.service';
import { CreateScParticipationDto } from './dto/create-sc-participation.dto';
import { UpdateScParticipationDto } from './dto/update-sc-participation.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('SC Participation')
@Controller('sc-participation')
@UseGuards(RolesGuard)
export class ScParticipationController {
  constructor(private readonly scParticipationService: ScParticipationService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create SC participation record' })
  @ApiBody({ type: CreateScParticipationDto })
  @ApiResponse({ status: 201, description: 'Participation record created.' })
  create(@Body() createScParticipationDto: CreateScParticipationDto) {
    return this.scParticipationService.create(createScParticipationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all SC participation records' })
  @ApiResponse({ status: 200, description: 'Participation records returned.' })
  findAll() {
    return this.scParticipationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one SC participation record by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record returned.' })
  findOne(@Param('id') id: string) {
    return this.scParticipationService.findOne(+id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an SC participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiBody({ type: UpdateScParticipationDto })
  @ApiResponse({ status: 200, description: 'Participation record updated.' })
  update(@Param('id') id: string, @Body() updateScParticipationDto: UpdateScParticipationDto) {
    return this.scParticipationService.update(+id, updateScParticipationDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an SC participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record deleted.' })
  remove(@Param('id') id: string) {
    return this.scParticipationService.remove(+id);
  }
}
