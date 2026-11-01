import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScInstrument } from '../sc-instrument.enum';
import { CAMP_ID_PATTERN } from './create-camp.dto';

export class UpsertMeasureDto {
  @ApiPropertyOptional({ description: 'Existing measure id (omit to create).' })
  @IsOptional()
  @IsInt()
  measureId?: number;

  @ApiPropertyOptional({
    description: 'Stable core code, unique within a camp.',
    example: 'SE_GENDER_BELIEF',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  coreCode?: string;

  @ApiProperty({ enum: ScInstrument, description: 'Instrument.' })
  @IsEnum(ScInstrument)
  instrument!: ScInstrument;

  @ApiProperty({ description: 'Measure name.' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Category.' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a core (comparable) measure.',
  })
  @IsOptional()
  @IsBoolean()
  isCore?: boolean;

  @ApiPropertyOptional({ description: 'Scale minimum.' })
  @IsOptional()
  @IsNumber()
  scaleMin?: number;

  @ApiPropertyOptional({ description: 'Scale maximum.' })
  @IsOptional()
  @IsNumber()
  scaleMax?: number;
}

export class UpsertMeasureResultDto {
  @ApiPropertyOptional({
    description: 'Existing measure id this result belongs to.',
  })
  @IsOptional()
  @IsInt()
  measureId?: number;

  @ApiPropertyOptional({
    description: 'Core code (alternative to measureId for matching).',
  })
  @IsOptional()
  @IsString()
  coreCode?: string;

  @ApiPropertyOptional({ description: 'Matched n.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  n?: number;

  @ApiPropertyOptional({
    description: 'Baseline mean (must sit within scale).',
  })
  @IsOptional()
  @IsNumber()
  meanA?: number;

  @ApiPropertyOptional({ description: 'Endline mean (must sit within scale).' })
  @IsOptional()
  @IsNumber()
  meanB?: number;

  @ApiPropertyOptional({ description: 'p-value between 0 and 1.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  pValue?: number;

  @ApiPropertyOptional({ description: 'Significant flag.' })
  @IsOptional()
  @IsBoolean()
  significant?: boolean;

  @ApiPropertyOptional({ description: 'Improved count.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  improvedN?: number;

  @ApiPropertyOptional({ description: 'Declined count.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  declinedN?: number;

  @ApiPropertyOptional({ description: 'Unchanged count.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sameN?: number;
}

export class UpsertResultsDto {
  @ApiProperty({ description: 'Camp id.', example: '2026-SUMMER' })
  @IsString()
  @Matches(CAMP_ID_PATTERN)
  campId!: string;

  @ApiPropertyOptional({ description: 'Measures to create/update.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertMeasureDto)
  measures?: UpsertMeasureDto[];

  @ApiPropertyOptional({ description: 'Measure results to upsert.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertMeasureResultDto)
  results?: UpsertMeasureResultDto[];
}
