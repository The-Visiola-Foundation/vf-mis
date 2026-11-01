import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScCamp } from './entities/sc-camp.entity';
import { ScMeasure } from './entities/sc-measure.entity';
import { ScMeasureResult } from './entities/sc-measure-result.entity';
import { ScEnrolment } from './entities/sc-enrolment.entity';
import { ScExpense } from './entities/sc-expense.entity';
import { pooledMean, sumCounts } from './utils/rollup.util';

@Injectable()
export class ScRollupService {
  constructor(
    @InjectRepository(ScCamp) private readonly campRepo: Repository<ScCamp>,
    @InjectRepository(ScMeasure)
    private readonly measureRepo: Repository<ScMeasure>,
    @InjectRepository(ScMeasureResult)
    private readonly resultRepo: Repository<ScMeasureResult>,
    @InjectRepository(ScEnrolment)
    private readonly enrolmentRepo: Repository<ScEnrolment>,
    @InjectRepository(ScExpense)
    private readonly expenseRepo: Repository<ScExpense>,
  ) {}

  async getYearRollup(year: number) {
    const camps = await this.campRepo.find({
      where: { campYear: year },
      order: { campId: 'ASC' },
    });
    if (camps.length === 0)
      throw new NotFoundException(`No camps for year ${year}`);
    const campIds = camps.map((c) => c.campId);
    const enrolments = await this.enrolmentRepo
      .createQueryBuilder('e')
      .where('e.campId IN (:...ids)', { ids: campIds })
      .getMany();
    const expenses = await this.expenseRepo
      .createQueryBuilder('e')
      .where('e.campId IN (:...ids)', { ids: campIds })
      .getMany();
    const measures = await this.measureRepo
      .createQueryBuilder('m')
      .where('m.campId IN (:...ids)', { ids: campIds })
      .getMany();
    const results = await this.resultRepo
      .createQueryBuilder('r')
      .where('r.campId IN (:...ids)', { ids: campIds })
      .getMany();
    const participantIds = [...new Set(enrolments.map((e) => e.participantId))];
    const codes = [
      ...new Set(
        measures
          .filter((m) => m.isCore && m.coreCode)
          .map((m) => m.coreCode as string),
      ),
    ];
    const coreCompare = codes.map((coreCode) => {
      const perCamp = camps.map((c) => {
        const m = measures.find(
          (x) => x.campId === c.campId && x.coreCode === coreCode,
        );
        const r = m
          ? results.find((x) => x.measureId === m.measureId)
          : undefined;
        return { campId: c.campId, measure: m ?? null, result: r ?? null };
      });
      return {
        coreCode,
        name: perCamp.find((p) => p.measure)?.measure?.name ?? coreCode,
        perCamp: perCamp.map((p) => ({
          campId: p.campId,
          n: p.result?.n ?? null,
          meanA: p.result?.meanA ?? null,
          meanB: p.result?.meanB ?? null,
          change: p.result?.change ?? null,
          pValue: p.result?.pValue ?? null,
          significant: p.result?.significant ?? null,
        })),
        pooledMeanB: pooledMean(
          perCamp.map((p) => ({
            mean: p.result?.meanB ?? null,
            n: p.result?.n ?? null,
          })),
        ),
        pooledN: sumCounts(perCamp.map((p) => p.result?.n ?? null)),
        pValue: null,
      };
    });
    const spend = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
    const spendKnown = expenses.some(
      (e) => e.amount !== null && e.amount !== undefined,
    );
    return {
      year,
      camps: camps.map((c) => ({
        id: c.campId,
        type: c.type,
        theme: c.theme ?? null,
      })),
      uniqueParticipants:
        participantIds.length > 0 ? participantIds.length : null,
      participations: enrolments.length > 0 ? enrolments.length : null,
      totalSpend: spendKnown ? spend : null,
      currency: expenses[0]?.currency ?? 'NGN',
      costPerParticipant:
        spendKnown && participantIds.length > 0
          ? spend / participantIds.length
          : null,
      coreCompare,
    };
  }

  async getCompare(coreCode: string) {
    const measures = await this.measureRepo.find({
      where: { coreCode },
      relations: { camp: true },
      order: { measureId: 'ASC' },
    });
    const camps = await Promise.all(
      measures.map(async (m) => ({
        campId: m.campId,
        campYear: m.camp?.campYear ?? null,
        isCore: m.isCore,
        result: await this.resultRepo.findOne({
          where: { campId: m.campId, measureId: m.measureId },
        }),
      })),
    );
    return {
      coreCode,
      name: measures[0]?.name ?? coreCode,
      camps: camps.map((c) => ({
        campId: c.campId,
        campYear: c.campYear,
        isCore: c.isCore,
        n: c.result?.n ?? null,
        meanA: c.result?.meanA ?? null,
        meanB: c.result?.meanB ?? null,
        change: c.result?.change ?? null,
        pValue: c.result?.pValue ?? null,
        significant: c.result?.significant ?? null,
        improvedN: c.result?.improvedN ?? null,
        declinedN: c.result?.declinedN ?? null,
        sameN: c.result?.sameN ?? null,
      })),
    };
  }
}
