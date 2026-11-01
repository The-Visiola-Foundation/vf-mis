import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CampType } from 'src/common/enum';

/** Camp id format YYYY-TYPE e.g. 2026-SUMMER, 2026-DECEMBER. */
export const CAMP_ID_PATTERN = /^[0-9]{4}-(SUMMER|DECEMBER)$/;

export class CreateCampDto {
  @ApiProperty({ description: 'Camp id (YYYY-TYPE).', example: '2026-SUMMER' })
  @IsString()
  @Matches(CAMP_ID_PATTERN, {
    message: 'campId must match YYYY-TYPE e.g. 2026-SUMMER',
  })
  @MaxLength(16)
  campId!: string;

  @ApiProperty({ description: 'Camp type.', enum: CampType, example: CampType.SSC })
  @IsEnum(CampType)
  type!: CampType;

  @ApiProperty({ description: 'Camp year.', example: 2026 })
  @IsInt()
  campYear!: number;

  @ApiPropertyOptional({
    description: 'Camp theme.',
    example: 'Renewable Energy',
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ description: 'Venue.' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO).' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO).' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Duration in days.', example: 8 })
  @IsOptional()
  @IsInt()
  durationDays?: number;

  @ApiPropertyOptional({ description: 'Cohort type.' })
  @IsOptional()
  @IsString()
  cohortType?: string;

  @ApiPropertyOptional({ description: 'Report date (ISO).' })
  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @ApiPropertyOptional({ description: 'Prepared by.' })
  @IsOptional()
  @IsString()
  preparedBy?: string;

  @ApiPropertyOptional({ description: 'Submitted to.' })
  @IsOptional()
  @IsString()
  submittedTo?: string;
}
