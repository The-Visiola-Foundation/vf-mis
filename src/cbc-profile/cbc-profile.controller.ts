import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { CbcProfileService } from './cbc-profile.service';
import { CreateCbcProfileDto } from './dto/create-cbc-profile.dto';
import { UpdateCbcProfileDto } from './dto/update-cbc-profile.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('CBC Profile')
@Controller('cbc-profile')
@UseGuards(RolesGuard)
export class CbcProfileController {
  constructor(private readonly cbcProfileService: CbcProfileService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a CBC profile' })
  @ApiBody({ type: CreateCbcProfileDto })
  @ApiResponse({ status: 201, description: 'CBC profile created.' })
  create(@Body() createCbcProfileDto: CreateCbcProfileDto) {
    return this.cbcProfileService.create(createCbcProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all CBC profiles' })
  @ApiResponse({ status: 200, description: 'CBC profiles returned.' })
  findAll() {
    return this.cbcProfileService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one CBC profile by id' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiResponse({ status: 200, description: 'CBC profile returned.' })
  findOne(@Param('id') id: string) {
    return this.cbcProfileService.findOne(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a CBC profile' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiBody({ type: UpdateCbcProfileDto })
  @ApiResponse({ status: 200, description: 'CBC profile updated.' })
  update(@Param('id') id: string, @Body() updateCbcProfileDto: UpdateCbcProfileDto) {
    return this.cbcProfileService.update(id, updateCbcProfileDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CBC profile' })
  @ApiParam({ name: 'id', type: String, description: 'Profile id' })
  @ApiResponse({ status: 200, description: 'CBC profile deleted.' })
  remove(@Param('id') id: string) {
    return this.cbcProfileService.remove(id);
  }
}
