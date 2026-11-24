import { Injectable, Logger } from '@nestjs/common';
import { CreateCbcParticipationDto } from './dto/create-cbc-participation.dto';
import { UpdateCbcParticipationDto } from './dto/update-cbc-participation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CbcParticipation } from './entities/cbc-participation.entity';
import { CbcProfile } from 'src/cbc-profile/entities/cbc-profile.entity';
import { Repository } from 'typeorm';
import { Cohort } from 'src/common/enum';
import { Track } from 'src/tracks/entities/track.entity';

export interface FindAllResult {
  year: number;
  total: number;
  uniqueCount: number;
  tracks: { trackId: string; trackName: string; studentCount: number }[];
  cohortsBreakdown?: { cohort: Cohort; studentCount: number }[];
}

@Injectable()
export class CbcParticipationService {

  constructor(
    @InjectRepository(CbcParticipation) private readonly participation: Repository<CbcParticipation>,
    @InjectRepository(CbcProfile) private readonly profile: Repository<CbcProfile>,
  ) { }

  async create(createCbcParticipationDto: CreateCbcParticipationDto) {
    const part = this.participation.create(createCbcParticipationDto as any);
    return await this.participation.save(part);
  }

2
  async findAll(year?: number) {
  // 1. Get total participation and unique student counts
  const summaryQuery = this.participation
    .createQueryBuilder('participation')
    .select('COUNT(*)', 'total')
    .addSelect(
      'COUNT(DISTINCT participation.studentId)',
      'uniqueCount',
    );

  if (year) {
    summaryQuery.where('participation.year = :year', { year });
  }

  const summary = await summaryQuery.getRawOne();

  // 2. Get participation counts and actual track names
  const tracksQuery = this.participation
    .createQueryBuilder('participation')
    .leftJoin(
      Track,
      'track',
      'CAST(track.id AS VARCHAR) = participation.trackId',
    )
    .select('participation.trackId', 'trackId')
    .addSelect(
      "COALESCE(track.track, CONCAT('Track ', participation.trackId))",
      'trackName',
    )
    .addSelect('COUNT(*)', 'studentCount')
    .groupBy('participation.trackId')
    .addGroupBy('track.track');

  if (year) {
    tracksQuery.where('participation.year = :year', { year });
  }

  const trackRecords = await tracksQuery.getRawMany();

  // 3. Build the result
  const result: FindAllResult = {
    year: year ?? 0,
    total: Number(summary.total),
    uniqueCount: Number(summary.uniqueCount),
    tracks: trackRecords.map((track) => ({
      trackId: track.trackId,
      trackName: track.trackName,
      studentCount: Number(track.studentCount),
    })),
  };

  // 4. Get student participation breakdown by cohort
  if (year) {
    const cohorts = await this.participation
      .createQueryBuilder('participation')
      .select('participation.cohort', 'cohort')
      .addSelect('COUNT(*)', 'studentCount')
      .where('participation.year = :year', { year })
      .groupBy('participation.cohort')
      .getRawMany();

    result.cohortsBreakdown = cohorts.map((item) => ({
      cohort: item.cohort,
      studentCount: Number(item.studentCount),
    }));
  }

  // 5. Get profile columns (for future use)
  const excludedFields = new Set(['id', 'studentId', 'school']);

  const profileColumns = this.profile.metadata.columns
    .filter((col) => !excludedFields.has(col.propertyName))
    .map((col) => col.propertyName);

  return result;
}


  async findOne(id: number) {
    return `await this.participation.findOneByOrFail({ id })`;
  }

  async update(id: number, updateCbcParticipationDto: UpdateCbcParticipationDto) {
    await this.participation.update(id, updateCbcParticipationDto as any);
    return await this.findOne(id);
  }

  async remove(id: number) {
    await this.participation.delete(id);
    return { success: true };
  }
}
