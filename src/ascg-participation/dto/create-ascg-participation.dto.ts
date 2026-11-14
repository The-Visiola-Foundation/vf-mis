import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Program } from 'src/common/enum';

export class CreateAscgParticipationDto {
  @ApiPropertyOptional({ description: 'Student identifier.', example: 'student-001' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ description: 'School identifier.', example: 'school-001' })
  @IsString()
  schoolId!: string;

  @ApiPropertyOptional({
    description: 'ASCG participation type.',
    enum: Program,
    default: Program.ASCG,
  })
  @IsOptional()
  @IsEnum(Program)
  type?: Program;

  @ApiProperty({ description: 'Participation year.', example: 2024 })
  @IsNumber()
  year!: number;
}
