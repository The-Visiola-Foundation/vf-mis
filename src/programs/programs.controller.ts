import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('Programs')
@Controller('programs')
@UseGuards(RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a program' })
  @ApiBody({ type: CreateProgramDto })
  @ApiResponse({ status: 201, description: 'Program created.' })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all programs' })
  @ApiResponse({ status: 200, description: 'Programs returned.' })
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one program by id' })
  @ApiParam({ name: 'id', type: String, description: 'Program id' })
  @ApiResponse({ status: 200, description: 'Program returned.' })
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a program' })
  @ApiParam({ name: 'id', type: String, description: 'Program id' })
  @ApiBody({ type: UpdateProgramDto })
  @ApiResponse({ status: 200, description: 'Program updated.' })
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a program' })
  @ApiParam({ name: 'id', type: String, description: 'Program id' })
  @ApiResponse({ status: 200, description: 'Program deleted.' })
  remove(@Param('id') id: string) {
    return this.programsService.remove(id);
  }
}
