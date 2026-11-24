import { PartialType } from '@nestjs/mapped-types';
import { CreateImpactMetricDto, CreateScParticipationDto } from './create-sc-participation.dto';

export class UpdateScParticipationDto extends PartialType(CreateScParticipationDto) { }

export class UpdateImpactMetricDto extends PartialType(CreateImpactMetricDto) { }