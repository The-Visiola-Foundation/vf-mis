import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { CbcParticipationService } from './cbc-participation.service';
import { CreateCbcParticipationDto } from './dto/create-cbc-participation.dto';
import { UpdateCbcParticipationDto } from './dto/update-cbc-participation.dto';
import { Public } from 'src/auth/decorators/public.decorator';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@Public()
@ApiTags('CBC Participation')
@Controller('cbc-participation')
@UseGuards(RolesGuard)
export class CbcParticipationController {
  constructor(private readonly cbcParticipationService: CbcParticipationService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create CBC participation record' })
  @ApiBody({ type: CreateCbcParticipationDto })
  @ApiResponse({ status: 201, description: 'Participation record created.' })
  create(@Body() createCbcParticipationDto: CreateCbcParticipationDto) {
    return this.cbcParticipationService.create(createCbcParticipationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all CBC participation records' })
  @ApiResponse({ status: 200, description: 'Participation records returned.' })
  findAll(@Query('year') year?: number) {
    return this.cbcParticipationService.findAll(year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one CBC participation record by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record returned.' })
  findOne(@Param('id') id: string) {
    return this.cbcParticipationService.findOne(+id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a CBC participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiBody({ type: UpdateCbcParticipationDto })
  @ApiResponse({ status: 200, description: 'Participation record updated.' })
  update(@Param('id') id: string, @Body() updateCbcParticipationDto: UpdateCbcParticipationDto) {
    return this.cbcParticipationService.update(+id, updateCbcParticipationDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CBC participation record' })
  @ApiParam({ name: 'id', type: Number, description: 'Participation record id' })
  @ApiResponse({ status: 200, description: 'Participation record deleted.' })
  remove(@Param('id') id: string) {
    return this.cbcParticipationService.remove(+id);
  }
}
