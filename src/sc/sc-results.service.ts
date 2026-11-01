import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScCamp } from './entities/sc-camp.entity';
import { ScMeasure } from './entities/sc-measure.entity';
import { ScMeasureResult } from './entities/sc-measure-result.entity';
import { UpsertResultsDto } from './dto/upsert-results.dto';

@Injectable()
export class ScResultsService {
  constructor(private readonly dataSource: DataSource) {}

  async bulkUpsertResults(dto: UpsertResultsDto) {
    return await this.dataSource.transaction(async (manager) => {
      const camp = await manager
        .getRepository(ScCamp)
        .findOne({ where: { campId: dto.campId } });
      if (!camp) throw new NotFoundException(`Camp ${dto.campId} not found`);
      const measureRepo = manager.getRepository(ScMeasure);
      const resultRepo = manager.getRepository(ScMeasureResult);
      const seen = new Set<string>();
      for (const m of dto.measures ?? []) {
        if (!m.coreCode) continue;
        const key = m.coreCode.toLowerCase();
        if (seen.has(key))
          throw new BadRequestException(
            `Duplicate core_code '${m.coreCode}' in payload`,
          );
        seen.add(key);
        const existing = await measureRepo.findOne({
          where: { campId: dto.campId, coreCode: m.coreCode },
        });
        if (existing && (!m.measureId || existing.measureId !== m.measureId)) {
          throw new BadRequestException(
            `core_code '${m.coreCode}' already exists in camp ${dto.campId}`,
          );
        }
      }
      const idByCore = new Map<string, number>();
      for (const m of dto.measures ?? []) {
        if (
          m.scaleMin != null &&
          m.scaleMax != null &&
          m.scaleMin > m.scaleMax
        ) {
          throw new BadRequestException(
            `scaleMin > scaleMax for measure '${m.name}'`,
          );
        }
        let entity: ScMeasure | null = null;
        if (m.measureId)
          entity = await measureRepo.findOne({
            where: { measureId: m.measureId, campId: dto.campId },
          });
        if (!entity) {
          entity = measureRepo.create({
            campId: dto.campId,
            coreCode: m.coreCode ?? null,
            instrument: m.instrument,
            name: m.name,
            category: m.category ?? null,
            isCore: m.isCore ?? !!m.coreCode,
            scaleMin: m.scaleMin ?? null,
            scaleMax: m.scaleMax ?? null,
          });
        } else {
          entity.coreCode = m.coreCode ?? entity.coreCode;
          entity.instrument = m.instrument ?? entity.instrument;
          entity.name = m.name ?? entity.name;
          entity.category = m.category ?? entity.category;
          if (m.isCore !== undefined) entity.isCore = m.isCore;
          if (m.scaleMin !== undefined) entity.scaleMin = m.scaleMin;
          if (m.scaleMax !== undefined) entity.scaleMax = m.scaleMax;
        }
        entity = await measureRepo.save(entity);
        if (entity.coreCode) idByCore.set(entity.coreCode, entity.measureId);
      }
      let savedCount = 0;
      for (const r of dto.results ?? []) {
        let measure: ScMeasure | null = null;
        if (r.measureId)
          measure = await measureRepo.findOne({
            where: { measureId: r.measureId, campId: dto.campId },
          });
        else if (r.coreCode) {
          const cached = idByCore.get(r.coreCode);
          measure = cached
            ? await measureRepo.findOne({ where: { measureId: cached } })
            : await measureRepo.findOne({
                where: { campId: dto.campId, coreCode: r.coreCode },
              });
        }
        if (!measure)
          throw new BadRequestException(
            'Each result must match a measure via measureId or coreCode',
          );
        if (r.pValue != null && (r.pValue < 0 || r.pValue > 1))
          throw new BadRequestException('pValue must be between 0 and 1');
        const checks: Array<[string, number | undefined]> = [
          ['meanA', r.meanA],
          ['meanB', r.meanB],
        ];
        for (const [key, val] of checks) {
          if (val == null) continue;
          if (measure.scaleMin != null && val < measure.scaleMin)
            throw new BadRequestException(`${key} below scale_min`);
          if (measure.scaleMax != null && val > measure.scaleMax)
            throw new BadRequestException(`${key} above scale_max`);
        }
        const change =
          r.meanA != null && r.meanB != null ? r.meanB - r.meanA : null;
        let entity = await resultRepo.findOne({
          where: { campId: dto.campId, measureId: measure.measureId },
        });
        if (!entity)
          entity = resultRepo.create({
            campId: dto.campId,
            measureId: measure.measureId,
          });
        entity.n = r.n ?? entity.n ?? null;
        entity.meanA = r.meanA ?? entity.meanA ?? null;
        entity.meanB = r.meanB ?? entity.meanB ?? null;
        entity.change = change;
        entity.pValue = r.pValue ?? entity.pValue ?? null;
        entity.significant = r.significant ?? entity.significant ?? null;
        entity.improvedN = r.improvedN ?? entity.improvedN ?? null;
        entity.declinedN = r.declinedN ?? entity.declinedN ?? null;
        entity.sameN = r.sameN ?? entity.sameN ?? null;
        await resultRepo.save(entity);
        savedCount += 1;
      }
      return {
        campId: dto.campId,
        measures: (dto.measures ?? []).length,
        results: savedCount,
      };
    });
  }
}
