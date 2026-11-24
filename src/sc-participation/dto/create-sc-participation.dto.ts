import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { CampType } from 'src/common/enum';
import { MetricCategory } from '../entities/sc-report.entity';

export class CreateScParticipationDto {
  @ApiPropertyOptional({
    description: 'Student identifier.',
    example: 'student-001',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'School name.',
    example: 'Green Valley School',
  })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiPropertyOptional({
    description: 'Camp type.',
    enum: CampType,
    example: CampType.SSC,
  })
  @IsEnum(CampType)
  @IsOptional()
  type?: CampType;

  @ApiProperty({
    description: 'Participation year.',
    example: 2024,
  })
  @IsNumber()
  year!: number;
}

export class CreateImpactMetricDto {
  @ApiProperty({
    description: 'Participation year.',
    example: 2024,
  })
  @IsNumber()
  year!: number;

  @ApiProperty({
    description: 'Camp type.',
    enum: CampType,
    example: CampType.SSC,
  })
  @IsEnum(CampType)
  type!: CampType;

  @ApiProperty({
    description: 'Name of the impact metric.',
    example: 'Gender belief in STEM',
  })
  @IsString()
  @IsNotEmpty()
  metricName!: string;

  @ApiProperty({
    description: 'Metric category.',
    enum: MetricCategory,
    example: MetricCategory.CORE,
  })
  @IsEnum(MetricCategory)
  category!: MetricCategory;

  @ApiPropertyOptional({
    description: 'Baseline score before the program.',
    example: 4.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  baselineScore?: number;

  @ApiPropertyOptional({
    description: 'Endline score after the program.',
    example: 4.6,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  endlineScore?: number;

  @ApiPropertyOptional({
    description: 'Change between baseline and endline scores.',
    example: 0.6,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  change?: number;

  @ApiPropertyOptional({
    description: 'Statistical p-value.',
    example: 0.05,
    minimum: 0,
    maximum: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1)
  pValue?: number;

  @IsNumber()
  @IsOptional()
  count?: number

  @IsNumber()
  @IsOptional()
  improved?: number

  @IsNumber()
  @IsOptional()
  stable?: number

  @IsNumber()
  @IsOptional()
  declined?: number
}