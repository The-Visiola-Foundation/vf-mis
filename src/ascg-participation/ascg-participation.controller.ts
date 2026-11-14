import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { AscgParticipationService } from './ascg-participation.service';
import { CreateAscgParticipationDto } from './dto/create-ascg-participation.dto';
import { UpdateAscgParticipationDto } from './dto/update-ascg-participation.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('ASCG Participation')
@Controller('ascg-participation')
@UseGuards(RolesGuard)
export class AscgParticipationController {
  constructor(private readonly ascgParticipationService: AscgParticipationService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create ASCG participation record' })
  @ApiBody({ type: CreateAscgParticipationDto })
  @ApiResponse({ status: 201, description: 'Participation record created.' })
  create(@Body() createAscgParticipationDto: CreateAscgParticipationDto) {
    return this.ascgParticipationService.create(createAscgParticipationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all ASCG participation records' })
  @ApiResponse({ status: 200, description: 'Participation records returned.' })
  findAll() {
    return this.ascgParticipationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one ASCG participation record by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record returned.' })
  findOne(@Param('id') id: string) {
    return this.ascgParticipationService.findOne(+id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an ASCG participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiBody({ type: UpdateAscgParticipationDto })
  @ApiResponse({ status: 200, description: 'Participation record updated.' })
  update(@Param('id') id: string, @Body() updateAscgParticipationDto: UpdateAscgParticipationDto) {
    return this.ascgParticipationService.update(+id, updateAscgParticipationDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ASCG participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record deleted.' })
  remove(@Param('id') id: string) {
    return this.ascgParticipationService.remove(+id);
  }
}
