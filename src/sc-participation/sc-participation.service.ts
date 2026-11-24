import { Injectable } from '@nestjs/common';
import { CreateImpactMetricDto, CreateScParticipationDto } from './dto/create-sc-participation.dto';
import { UpdateImpactMetricDto, UpdateScParticipationDto } from './dto/update-sc-participation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ScParticipation } from './entities/sc-participation.entity';
import { Repository } from 'typeorm';
import { CampType } from 'src/common/enum';
import { SCMetric } from './entities/sc-report.entity';

@Injectable()
export class ScParticipationService {
  constructor(
    @InjectRepository(ScParticipation) private readonly scParticipationRepository: Repository<ScParticipation>,
    @InjectRepository(SCMetric) private readonly scMetricRepository: Repository<SCMetric>
  ) { }

  async create(createScParticipationDto: CreateScParticipationDto) {
    const participation = this.scParticipationRepository.create(createScParticipationDto);
    return await this.scParticipationRepository.save(participation);
  }

  async findAll(year: number | undefined) {
    const query = this.scParticipationRepository
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(CASE WHEN p.type = :ssc THEN 1 END)`,
        'sscCount',
      )
      .addSelect(
        `COUNT(CASE WHEN p.type = :dsc THEN 1 END)`,
        'dscCount',
      )
      .setParameters({
        ssc: CampType.SSC,
        dsc: CampType.DSC,
      });

    if (year) {
      query.where('p.year = :year', { year });
    }

    const records = await query.getRawOne();

    let metricQuery;
    if (year) {
      metricQuery = await this.scMetricRepository.find({ where: { year } });
    } else {
      metricQuery = await this.scMetricRepository.find({
        order: { year: 'DESC' },
        take: 1
      });

      const currentYear = metricQuery.year as number
      metricQuery = metricQuery = await this.scMetricRepository.find({ where: { year } });
    }


    return {
      year: year ?? 0,
      total: Number(records.total),
      sscCount: Number(records.sscCount),
      dscCount: Number(records.dscCount),
      metrics: metricQuery
    };
  }

  async findOne(id: number) {
    return await this.scParticipationRepository.findOneByOrFail({ id });
  }

  async update(id: number, updateScParticipationDto: UpdateScParticipationDto) {
    await this.scParticipationRepository.update(id, updateScParticipationDto as any);
    return await this.findOne(id);
  }

  async remove(id: number) {
    await this.scParticipationRepository.delete(id);
    return { success: true };
  }

  // Add Metrics data

  async addMetric(data: CreateImpactMetricDto) {
    const metric = this.scMetricRepository.create(data);
    await this.scMetricRepository.save(metric)
  }

  async getMetric(id: number) {
    return await this.scMetricRepository.findOne({ where: { id } })
  }

  async editMetric(id: number, data: UpdateImpactMetricDto) {
    try {
      console.log(typeof id)
      await this.scMetricRepository.update(id, data);
      return await this.getMetric(id)
    } catch (error) {
      console.log(error)
    }
  }

  async deleteSingleMetric(id: number) {
    await this.scMetricRepository.delete(id)
    return { success: true }
  }

  async deleteMetric() {
    await this.scMetricRepository.deleteAll()
    return { success: true }
  }


}
