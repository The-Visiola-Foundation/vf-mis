import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WriteProtected } from 'src/auth/decorators/write-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const STAFF = [UserRole.ADMIN, UserRole.KEY_STAFF, UserRole.PROGRAMME_STAFF];

@ApiTags('Students')
@Controller('students')
@UseGuards(RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @WriteProtected()
  @Roles(...STAFF)
  @Post()
  @ApiOperation({ summary: 'Create a student record' })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({ status: 201, description: 'Student created.' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Post('batch')
  @ApiOperation({ summary: 'Create multiple student records' })
  @ApiBody({ type: [CreateStudentDto] })
  @ApiResponse({ status: 201, description: 'Students created.' })
  createMany(@Body() createStudentDtos: CreateStudentDto[]) {
    return this.studentsService.createMany(createStudentDtos);
  }

  @Get()
  @ApiOperation({ summary: 'List students' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by full name' })
  @ApiQuery({ name: 'firstName', required: false, type: String, description: 'Filter by first name' })
  @ApiQuery({ name: 'lastName', required: false, type: String, description: 'Filter by last name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiResponse({ status: 200, description: 'Students returned.' })
  findAll(
    @Query('name') name?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentsService.findAll(name, page, limit);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete()
  @ApiOperation({ summary: 'Delete all student records' })
  @ApiResponse({ status: 200, description: 'All student records deleted.' })
  delete() {
    return this.studentsService.deleteAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch one student by id' })
  @ApiParam({ name: 'id', type: String, description: 'Student id' })
  @ApiResponse({ status: 200, description: 'Student returned.' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student record' })
  @ApiParam({ name: 'id', type: String, description: 'Student id' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({ status: 200, description: 'Student updated.' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @WriteProtected()
  @Roles(...STAFF)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student record' })
  @ApiParam({ name: 'id', type: String, description: 'Student id' })
  @ApiResponse({ status: 200, description: 'Student deleted.' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

}
