import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AscgParticipation } from 'src/ascg-participation/entities/ascg-participation.entity';
import { CbcParticipation } from 'src/cbc-participation/entities/cbc-participation.entity';
import { ScParticipation } from 'src/sc-participation/entities/sc-participation.entity';
import { School } from 'src/schools/entities/school.entity';
import { Student } from 'src/students/entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @InjectRepository(AscgParticipation) private readonly ascgParticipationRepo: Repository<AscgParticipation>,
    @InjectRepository(ScParticipation) private readonly scParticipationRepo: Repository<ScParticipation>,
    @InjectRepository(CbcParticipation) private readonly cbcParticipationRepo: Repository<CbcParticipation>,
  ) {}

  async getOverview() {
    const [students, schools, ascg, cbc, sc] = await Promise.all([
      this.studentRepo.count(),
      this.schoolRepo.count(),
      this.ascgParticipationRepo.count(),
      this.cbcParticipationRepo.count(),
      this.scParticipationRepo.count(),
    ]);

    return {
      students,
      participation: ascg + cbc + sc,
      schools,
    };
  }

  /**
   * Combined reach data: yearly breakdown + per-program cards.
   */
  async getReach() {
    try {
      const [yearly, programs] = await Promise.all([
        this.getYearlyReach(),
        this.getProgramStats(),
      ]);

      return { yearly, programs };
    } catch (error) {
      console.error('Error fetching reach data:', error);
      throw error;
    }
  }

  /**
   * For every year: unique students in that year and
   * returning students (students whose yearJoined differs from the participation year).
   */
  async getYearlyReach() {
    const [ascgRows, cbcRows, scRows] = await Promise.all([
      this.ascgParticipationRepo
        .createQueryBuilder('participation')
        .innerJoin('participation.student', 'student')
        .select('participation.year', 'year')
        .addSelect('COUNT(DISTINCT student.id)', 'totalStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined = participation.year THEN student.id END)`, 'newStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined <> participation.year THEN student.id END)`, 'returningStudents')
        .groupBy('participation.year')
        .orderBy('participation.year', 'ASC')
        .getRawMany(),
      this.cbcParticipationRepo
        .createQueryBuilder('participation')
        .innerJoin('participation.student', 'student')
        .select('participation.year', 'year')
        .addSelect('COUNT(DISTINCT student.id)', 'totalStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined = participation.year THEN student.id END)`, 'newStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined <> participation.year THEN student.id END)`, 'returningStudents')
        .groupBy('participation.year')
        .orderBy('participation.year', 'ASC')
        .getRawMany(),
      this.scParticipationRepo
        .createQueryBuilder('participation')
        .innerJoin('participation.student', 'student')
        .select('participation.year', 'year')
        .addSelect('COUNT(DISTINCT student.id)', 'totalStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined = participation.year THEN student.id END)`, 'newStudents')
        .addSelect(`COUNT(DISTINCT CASE WHEN student.yearJoined <> participation.year THEN student.id END)`, 'returningStudents')
        .groupBy('participation.year')
        .orderBy('participation.year', 'ASC')
        .getRawMany(),
    ]);

    const byYear = new Map<number, { uniqueStudents: number; returningStudents: number }>();

    for (const rows of [ascgRows, cbcRows, scRows]) {
      for (const row of rows) {
        const year = Number(row.year);
        const previous = byYear.get(year) ?? { uniqueStudents: 0, returningStudents: 0 };

        previous.uniqueStudents += Number(row.totalStudents ?? 0);
        previous.returningStudents += Number(row.returningStudents ?? 0);
        byYear.set(year, previous);
      }
    }

    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, stats]) => ({
        year,
        uniqueStudents: stats.uniqueStudents,
        returningStudents: stats.returningStudents,
      }));
  }

  /**
   * Per-program stats: unique students, total participations,
   * returning participations (total - unique) and the first year on record.
   */
  async getProgramStats() {
    const [ascg, cbc, sc] = await Promise.all([
      this.buildProgramStats(this.ascgParticipationRepo),
      this.buildProgramStats(this.cbcParticipationRepo),
      this.buildProgramStats(this.scParticipationRepo),
    ]);

    return [
      { id: 'ascg', program: 'ASCG', description: 'After-school STEM Clubs for Girls', ...ascg },
      { id: 'cbc', program: 'CBC', description: 'Coding Bootcamps for Women', ...cbc },
      { id: 'sc', program: 'SC', description: 'STEM Camps', ...sc },
    ];
  }

  private async buildProgramStats(
    repo: Repository<any>,
    filter?: { clause: string; params: Record<string, any> },
  ) {
    const qb = repo
      .createQueryBuilder('p')
      .innerJoin('p.student', 'student')
      .select('COUNT(DISTINCT student.id)', 'uniqueStudents')
      .addSelect('COUNT(p.id)', 'totalParticipations')
      .addSelect('MIN(p.year)', 'since');

    if (filter) qb.where(filter.clause, filter.params);

    const raw = await qb.getRawOne();

    const uniqueStudents = Number(raw?.uniqueStudents ?? 0);
    const totalParticipations = Number(raw?.totalParticipations ?? 0);

    return {
      uniqueStudents,
      totalParticipations,
      returningParticipations: totalParticipations - uniqueStudents,
      since: raw?.since ? Number(raw.since) : null,
    };
  }
}