import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { AscgProfileService } from './ascg-profile.service';
import { CreateAscgProfileDto } from './dto/create-ascg-profile.dto';
import { UpdateAscgProfileDto } from './dto/update-ascg-profile.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('ASCG Profile')
@Controller('ascg-profile')
@UseGuards(RolesGuard)
export class AscgProfileController {
  constructor(private readonly ascgProfileService: AscgProfileService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create an ASCG profile' })
  @ApiBody({ type: CreateAscgProfileDto })
  @ApiResponse({ status: 201, description: 'ASCG profile created.' })
  create(@Body() createAscgProfileDto: CreateAscgProfileDto) {
    return this.ascgProfileService.create(createAscgProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all ASCG profiles' })
  @ApiResponse({ status: 200, description: 'ASCG profiles returned.' })
  findAll() {
    return this.ascgProfileService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one ASCG profile by id' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiResponse({ status: 200, description: 'ASCG profile returned.' })
  findOne(@Param('id') id: string) {
    return this.ascgProfileService.findOne(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an ASCG profile' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiBody({ type: UpdateAscgProfileDto })
  @ApiResponse({ status: 200, description: 'ASCG profile updated.' })
  update(@Param('id') id: string, @Body() updateAscgProfileDto: UpdateAscgProfileDto) {
    return this.ascgProfileService.update(id, updateAscgProfileDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ASCG profile' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiResponse({ status: 200, description: 'ASCG profile deleted.' })
  remove(@Param('id') id: string) {
    return this.ascgProfileService.remove(id);
  }
}
