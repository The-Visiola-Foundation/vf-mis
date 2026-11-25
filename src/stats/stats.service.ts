import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AscgParticipation } from 'src/ascg-participation/entities/ascg-participation.entity';
import { CbcParticipation } from 'src/cbc-participation/entities/cbc-participation.entity';
import { ScParticipation } from 'src/sc-participation/entities/sc-participation.entity';
import { Program } from 'src/common/enum';
import { School } from 'src/schools/entities/school.entity';
import { Student } from 'src/students/entities/student.entity';
import { Repository, In } from 'typeorm';
import { AscgProfile } from 'src/ascg-profile/entities/ascg-profile.entity';
import { Academics } from 'src/academics/entities/academics.entity';
import { Track } from 'src/tracks/entities/track.entity';
import { camelToWords } from 'src/common/utils/paired-t-test';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @InjectRepository(AscgParticipation) private readonly ascgParticipationRepo: Repository<AscgParticipation>,
    @InjectRepository(ScParticipation) private readonly scParticipationRepo: Repository<ScParticipation>,
    @InjectRepository(CbcParticipation) private readonly cbcParticipationRepo: Repository<CbcParticipation>,
    @InjectRepository(AscgProfile) private readonly ascgProfileRepo: Repository<AscgProfile>,
    @InjectRepository(Academics) private readonly academicRepo: Repository<Academics>,
    @InjectRepository(Track) private readonly trackRepo: Repository<Track>
  ) { }

  async getOverview() {
    const [students, schools, ascg, cbc, sc] = await Promise.all([
      this.studentRepo.count(),
      this.schoolRepo.count(),
      this.ascgParticipationRepo.count(),
      this.cbcParticipationRepo.count(),
      this.scParticipationRepo.count(),
    ]);

    const excludedFields = new Set(['id', 'studentId', 'schoolId', 'examCode']);
    const profileColumns = this.ascgProfileRepo.metadata.columns
      .filter((column) => !excludedFields.has(column.propertyName))
      .map((column) => column.propertyName);

    const ascgProfileFieldCompletion = profileColumns.length
      ? await Promise.all(
        profileColumns.map(async (field) => {
          const qb = this.ascgProfileRepo
            .createQueryBuilder('profile')
            .select(
              `SUM(CASE WHEN profile.${field} IS NULL OR TRIM(CAST(profile.${field} AS CHAR)) = '' THEN 1 ELSE 0 END)`,
              'emptyFields',
            )
            .addSelect(
              `SUM(CASE WHEN profile.${field} IS NOT NULL AND TRIM(CAST(profile.${field} AS CHAR)) <> '' THEN 1 ELSE 0 END)`,
              'filledFields',
            );

          const raw = await qb.getRawOne();

          return {
            field: camelToWords(field),
            emptyFields: Number(raw?.emptyFields ?? 0),
            filledFields: Number(raw?.filledFields ?? 0),
          };
        }),
      ).then((byField) => {
        const totals = byField.reduce(
          (acc, item) => {
            acc.emptyFields += item.emptyFields;
            acc.filledFields += item.filledFields;
            return acc;
          },
          { emptyFields: 0, filledFields: 0 },
        );

        return {
          totalFields: profileColumns.length,
          emptyFields: totals.emptyFields,
          filledFields: totals.filledFields,
          byField,
        };
      })
      : {
        totalFields: 0,
        emptyFields: 0,
        filledFields: 0,
        byField: [],
      };

    return {
      students,
      participation: ascg + cbc + sc,
      schools,
      ascgProfileFieldCompletion,

    };
  }

  async getReach(year?: number | string) {
    try {
      const [yearly, programs] = await Promise.all([
        this.getYearlyReach(year),
        this.getProgramStats(year),
      ]);

      return { yearly, programs };
    } catch (error) {
      console.error('Error fetching reach data:', error);
      throw error;
    }
  }

  async getYearlyReach(year?: number | string) {
    const hasYear = year !== undefined && year !== null && year !== '' && !Number.isNaN(Number(year));
    const selectedYear = hasYear ? Number(year) : undefined;

    const fetchYearlyStats = async (repository: any) => {
      const qb = repository
        .createQueryBuilder('participation')
        .innerJoin('participation.student', 'student')
        .select('participation.year', 'year')
        .addSelect('COUNT(*)', 'totalParticipation')
        .addSelect(
          `COUNT(CASE WHEN student.yearJoined = participation.year THEN 1 END)`,
          'newStudents',
        )
        .addSelect(
          `COUNT(CASE WHEN student.yearJoined < participation.year THEN 1 END)`,
          'returningStudents',
        )
        .addSelect(
          `COUNT(CASE WHEN student.yearJoined IS NULL OR student.yearJoined > participation.year THEN 1 END)`,
          'unclassifiedStudents',
        );

      if (selectedYear !== undefined) {
        qb.where('participation.year = :year', { year: selectedYear });
      }

      return qb
        .groupBy('participation.year')
        .orderBy('participation.year', 'ASC')
        .getRawMany();
    };

    const [ascgRows, cbcRows, scRows] = await Promise.all([
      fetchYearlyStats(this.ascgParticipationRepo),
      fetchYearlyStats(this.cbcParticipationRepo),
      fetchYearlyStats(this.scParticipationRepo),
    ]);

    const byYear = new Map<
      number,
      {
        totalParticipation: number;
        newStudents: number;
        returningStudents: number;
        unclassifiedStudents: number;
      }
    >();

    for (const rows of [ascgRows, cbcRows, scRows]) {
      for (const row of rows) {
        const year = Number(row.year);

        const previous = byYear.get(year) ?? {
          totalParticipation: 0,
          newStudents: 0,
          returningStudents: 0,
          unclassifiedStudents: 0,
        };

        previous.totalParticipation += Number(row.totalParticipation ?? 0);
        previous.newStudents += Number(row.newStudents ?? 0);
        previous.returningStudents += Number(row.returningStudents ?? 0);
        previous.unclassifiedStudents += Number(row.unclassifiedStudents ?? 0);

        byYear.set(year, previous);
      }
    }

    const yearlyStats = Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, stats]) => ({
        year,
        ...stats,
      }));

    const filteredYearlyStats = selectedYear !== undefined
      ? yearlyStats.filter((item) => item.year === selectedYear)
      : yearlyStats;

    const totals = filteredYearlyStats.reduce(
      (acc, item) => ({
        totalParticipation:
          acc.totalParticipation + item.totalParticipation,
        newStudents: acc.newStudents + item.newStudents,
        returningStudents:
          acc.returningStudents + item.returningStudents,
        unclassifiedStudents:
          acc.unclassifiedStudents + item.unclassifiedStudents,
      }),
      {
        totalParticipation: 0,
        newStudents: 0,
        returningStudents: 0,
        unclassifiedStudents: 0,
      },
    );

    return {
      yearlyStats: filteredYearlyStats,
      totals,
    };
  }

  async getProgramStats(year?: number | string) {
    const hasYear = year !== undefined && year !== null && year !== '' && !Number.isNaN(Number(year));
    const selectedYear = hasYear ? Number(year) : undefined;

    const [ascg, outreach, cbc, sc] = await Promise.all([
      this.buildProgramStats(this.ascgParticipationRepo, Program.ASCG, undefined, selectedYear),
      this.buildProgramStats(this.ascgParticipationRepo, Program.OUTREACH, undefined, selectedYear),
      this.buildProgramStats(this.cbcParticipationRepo, undefined, undefined, selectedYear),
      this.buildProgramStats(this.scParticipationRepo, undefined, undefined, selectedYear),
    ]);

    return [
      { id: 'ascg', program: 'ASCG', description: 'After-school STEM Clubs for Girls', ...ascg },
      { id: 'outreach', program: 'OUTREACH', description: 'Outreach programmes', ...outreach },
      { id: 'cbc', program: 'CBC', description: 'Coding Bootcamps for Women', ...cbc },
      { id: 'sc', program: 'SC', description: 'STEM Camps', ...sc },
    ];
  }

  async getBoardStats(year?: number | string) {
    const hasYear = year !== undefined && year !== null && year !== '' && !Number.isNaN(Number(year));
    const selectedYear = hasYear ? Number(year) : undefined;

    const [ascg, cbc, sc, countries, students] = await Promise.all([
      this.buildProgramStats(this.ascgParticipationRepo, Program.ASCG, undefined, selectedYear),
      // this.buildProgramStats(this.ascgParticipationRepo, Program.OUTREACH, undefined, selectedYear),
      this.buildProgramStats(this.cbcParticipationRepo, undefined, undefined, selectedYear),
      this.buildProgramStats(this.scParticipationRepo, undefined, undefined, selectedYear),
      this.getCountryBreakdown(),
      this.studentRepo.count()
    ]);


    const studentCountByYear = await this.studentRepo
      .createQueryBuilder('student')
      .select('student.yearJoined', 'year')
      .addSelect('COUNT(student.id)', 'count')
      .groupBy('student.yearJoined')
      .orderBy('student.yearJoined', 'ASC')
      .getRawMany();




    const studentTotal = await this.ascgProfileRepo.count();
    const consentTotal = await this.ascgProfileRepo.count({ where: { parentalConsent: true } });

    const consentRate = studentTotal > 0 ? (consentTotal / studentTotal) * 100 : 0;
    const schoolsCount = await this.schoolRepo.count();
    const trackCount = await this.trackRepo.count();
    const academics = await this.academicRepo.find();

    return {
      ASCG: {
        program: 'ASCG', description: 'After-school STEM Clubs for Girls',
        schools: schoolsCount,
        academics,
        ...ascg
      },
      // OUTREACH: { program: 'OUTREACH', description: 'Outreach programmes', ...outreach },
      CBC: { program: 'CBC', description: 'Coding Bootcamps for Women', trackCount, ...cbc },
      SC: { program: 'SC', description: 'STEM Camps', ...sc },
      consentRate: consentRate.toFixed(2) + '%',
      studentCountByYear,
      students,
      countries
    };
  }

  async getCountryBreakdown() {
    return await this.studentRepo
      .createQueryBuilder('p')
      .select('p.country', 'country')
      .addSelect('COUNT(DISTINCT p.id)', 'studentCount')
      .groupBy('p.country')
      .getRawMany()
  }

  async diagnoseParticipationCounts() {
    const repositories = [
      { name: 'ASCG', repo: this.ascgParticipationRepo },
      { name: 'CBC', repo: this.cbcParticipationRepo },
      { name: 'STEM Camp', repo: this.scParticipationRepo },
    ];

    const results = await Promise.all(
      repositories.map(async ({ name, repo }) => {
        const rows = await repo
          .createQueryBuilder('participation')
          .leftJoin('participation.student', 'student')
          .select('participation.year', 'year')
          .addSelect('COUNT(*)', 'participationRecords')
          .addSelect('COUNT(student.id)', 'matchedRecords')
          .addSelect(
            'COUNT(DISTINCT student.id)',
            'uniqueStudents',
          )
          .addSelect(
            `COUNT(DISTINCT CASE
            WHEN student.yearJoined = participation.year
            THEN student.id
          END)`,
            'newStudents',
          )
          .addSelect(
            `COUNT(DISTINCT CASE
            WHEN student.yearJoined < participation.year
            THEN student.id
          END)`,
            'returningStudents',
          )
          .addSelect(
            `COUNT(DISTINCT CASE
            WHEN student.id IS NULL
            THEN participation.id
          END)`,
            'missingStudentRecords',
          )
          .groupBy('participation.year')
          .orderBy('participation.year', 'ASC')
          .getRawMany();

        return {
          program: name,
          years: rows.map((row) => ({
            year: Number(row.year),
            participationRecords: Number(row.participationRecords),
            matchedRecords: Number(row.matchedRecords),
            uniqueStudents: Number(row.uniqueStudents),
            newStudents: Number(row.newStudents),
            returningStudents: Number(row.returningStudents),
            missingStudentRecords: Number(row.missingStudentRecords),
            duplicateRecords:
              Number(row.participationRecords) -
              Number(row.uniqueStudents),
            unclassifiedStudents:
              Number(row.uniqueStudents) -
              Number(row.newStudents) -
              Number(row.returningStudents),
          })),
        };
      }),
    );

    return results;
  }

  async getUnclassifiedStudents() {
    try {
      const fetchUnclassified = async (
        repository: any,
        program: string,
      ) => {
        const records = await repository
          .createQueryBuilder('participation')
          .innerJoinAndSelect('participation.student', 'student')
          .where(
            'student.yearJoined IS NULL OR student.yearJoined > participation.year',
          )
          .orderBy('participation.year', 'ASC')
          .getMany();

        return records.map((participation: any) => ({
          program,
          participationId: participation.id,
          participationYear: participation.year,
          reason:
            participation.student.yearJoined == null
              ? 'Missing yearJoined'
              : 'yearJoined is after participation year',
          student: participation.student,
          schoolId: participation.schoolId ?? null,
          school: null,
          participationDetails: {
            type: participation.type ?? null,
            cohort: participation.cohort ?? null,
            class: participation.class ?? null,
            theme: participation.theme ?? null,
            trackId: participation.trackId ?? null,
          },
        }));
      };

      const [ascg, cbc, sc] = await Promise.all([
        fetchUnclassified(this.ascgParticipationRepo, 'ASCG'),
        fetchUnclassified(this.cbcParticipationRepo, 'CBC'),
        fetchUnclassified(this.scParticipationRepo, 'STEM Camp'),
      ]);

      // Collect unique ASCG school IDs.
      const schoolIds = [
        ...new Set(
          ascg
            .map((record) => record.schoolId)
            .filter((id): id is string => !!id),
        ),
      ];

      // Fetch matching schools separately.
      const schools = schoolIds.length
        ? await this.schoolRepo.findBy({ id: In(schoolIds) })
        : [];

      const schoolMap = new Map(
        schools.map((school: any) => [school.id, school]),
      );

      // Attach school information to ASCG records.
      for (const record of ascg) {
        record.school = schoolMap.get(record.schoolId) ?? null;
      }

      const records = [...ascg, ...cbc, ...sc];

      return {
        totalUnclassifiedRecords: records.length,
        summary: {
          ASCG: ascg.length,
          CBC: cbc.length,
          STEMCamp: sc.length,
        },
        records,
      };
    } catch (error) {
      console.error('Error fetching unclassified students:', error);
    }
  }

  private async buildProgramStats(
    repo: Repository<any>,
    type?: Program,
    filter?: { clause: string; params: Record<string, any> },
    year?: number,
  ) {
    const qb = repo
      .createQueryBuilder('p')
      .innerJoin('p.student', 'student')
      .select('COUNT(DISTINCT student.id)', 'uniqueStudents')
      .addSelect('COUNT(p.id)', 'totalParticipations')
      .addSelect('MIN(p.year)', 'since');

    if (type) {
      qb.where('p.type = :type', { type });
    }

    if (year !== undefined && year !== null) {
      if (type) {
        qb.andWhere('p.year = :year', { year });
      } else {
        qb.where('p.year = :year', { year });
      }
    }

    if (filter) qb.andWhere(filter.clause, filter.params);

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