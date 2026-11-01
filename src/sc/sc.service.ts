import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ScCamp } from './entities/sc-camp.entity';
import { ScMeasure } from './entities/sc-measure.entity';
import { ScObsPoint } from './entities/sc-obs-point.entity';
import { ScMeasureResult } from './entities/sc-measure-result.entity';
import { ScEnrolment } from './entities/sc-enrolment.entity';
import { ScAttendance } from './entities/sc-attendance.entity';
import { ScAssessmentSummary } from './entities/sc-assessment-summary.entity';
import { ScInterestArea } from './entities/sc-interest-area.entity';
import { ScFeedbackSummary } from './entities/sc-feedback-summary.entity';
import { ScRatingDist } from './entities/sc-rating-dist.entity';
import { ScFeedbackItem } from './entities/sc-feedback-item.entity';
import { ScActivityVote } from './entities/sc-activity-vote.entity';
import { ScImprovementTheme } from './entities/sc-improvement-theme.entity';
import { ScProject } from './entities/sc-project.entity';
import { ScJudgingScore } from './entities/sc-judging-score.entity';
import { ScAward } from './entities/sc-award.entity';
import { ScPartnerEngagement } from './entities/sc-partner-engagement.entity';
import { ScExpense } from './entities/sc-expense.entity';
import { ScRecommendation } from './entities/sc-recommendation.entity';
import { CreateCampDto } from './dto/create-camp.dto';
import { ScInstrument } from './sc-instrument.enum';
import { pctFromCounts } from './utils/rollup.util';

@Injectable()
export class ScService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ScCamp) private readonly campRepo: Repository<ScCamp>,
    @InjectRepository(ScMeasure)
    private readonly measureRepo: Repository<ScMeasure>,
    @InjectRepository(ScObsPoint)
    private readonly obsPointRepo: Repository<ScObsPoint>,
    @InjectRepository(ScMeasureResult)
    private readonly resultRepo: Repository<ScMeasureResult>,
    @InjectRepository(ScEnrolment)
    private readonly enrolmentRepo: Repository<ScEnrolment>,
    @InjectRepository(ScAttendance)
    private readonly attendanceRepo: Repository<ScAttendance>,
    @InjectRepository(ScAssessmentSummary)
    private readonly assessmentRepo: Repository<ScAssessmentSummary>,
    @InjectRepository(ScInterestArea)
    private readonly interestRepo: Repository<ScInterestArea>,
    @InjectRepository(ScFeedbackSummary)
    private readonly feedbackRepo: Repository<ScFeedbackSummary>,
    @InjectRepository(ScRatingDist)
    private readonly ratingRepo: Repository<ScRatingDist>,
    @InjectRepository(ScFeedbackItem)
    private readonly feedbackItemRepo: Repository<ScFeedbackItem>,
    @InjectRepository(ScActivityVote)
    private readonly activityRepo: Repository<ScActivityVote>,
    @InjectRepository(ScImprovementTheme)
    private readonly improvementRepo: Repository<ScImprovementTheme>,
    @InjectRepository(ScProject)
    private readonly projectRepo: Repository<ScProject>,
    @InjectRepository(ScJudgingScore)
    private readonly judgingRepo: Repository<ScJudgingScore>,
    @InjectRepository(ScAward)
    private readonly awardRepo: Repository<ScAward>,
    @InjectRepository(ScPartnerEngagement)
    private readonly partnerRepo: Repository<ScPartnerEngagement>,
    @InjectRepository(ScExpense)
    private readonly expenseRepo: Repository<ScExpense>,
    @InjectRepository(ScRecommendation)
    private readonly recommendationRepo: Repository<ScRecommendation>,
  ) {}

  async listCamps() {
    const camps = await this.campRepo.find({
      order: { campYear: 'DESC', campId: 'ASC' },
    });
    return Promise.all(
      camps.map(async (c) => ({
        id: c.campId,
        type: c.type,
        year: c.campYear,
        theme: c.theme ?? null,
        hasResults: await this.hasResults(c.campId),
      })),
    );
  }

  private async hasResults(campId: string): Promise<boolean> {
    const [results, enrolments] = await Promise.all([
      this.resultRepo.count({ where: { campId } }),
      this.enrolmentRepo.count({ where: { campId } }),
    ]);
    return results > 0 || enrolments > 0;
  }

  async createCamp(dto: CreateCampDto) {
    const camp = this.campRepo.create({
      campId: dto.campId,
      type: dto.type,
      campYear: dto.campYear,
      theme: dto.theme ?? null,
      venue: dto.venue ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      durationDays: dto.durationDays ?? null,
      cohortType: dto.cohortType ?? null,
      reportDate: dto.reportDate ? new Date(dto.reportDate) : null,
      preparedBy: dto.preparedBy ?? null,
      submittedTo: dto.submittedTo ?? null,
    });
    return await this.campRepo.save(camp);
  }

  async getImpact(campId: string) {
    const camp = await this.campRepo.findOne({
      where: { campId },
    });
    if (!camp) throw new NotFoundException(`Camp ${campId} not found`);
    const [measures, results, enrolments, attendance, obsPoints, assessment] =
      await Promise.all([
        this.measureRepo.find({
          where: { campId },
          order: { measureId: 'ASC' },
        }),
        this.resultRepo.find({
          where: { campId },
          relations: { measure: true },
        }),
        this.enrolmentRepo.find({
          where: { campId },
          relations: { classLevel: true, track: true },
        }),
        this.attendanceRepo.find({
          where: { campId },
          order: { dayNumber: 'ASC' },
        }),
        this.obsPointRepo.find({
          where: { campId },
          order: { pointNo: 'ASC' },
        }),
        this.assessmentRepo.findOne({ where: { campId } }),
      ]);
    const resultByMeasure = new Map(results.map((r) => [r.measureId, r]));
    const byInstrument = (inst: ScInstrument) =>
      measures
        .filter((m) => m.instrument === inst)
        .map((m) => {
          const r = resultByMeasure.get(m.measureId);
          return {
            coreCode: m.coreCode ?? null,
            name: m.name,
            category: m.category ?? null,
            isCore: m.isCore,
            scaleMin: m.scaleMin ?? null,
            scaleMax: m.scaleMax ?? null,
            n: r?.n ?? null,
            meanA: r?.meanA ?? null,
            meanB: r?.meanB ?? null,
            change:
              r?.change ??
              (r?.meanA != null && r?.meanB != null ? r.meanB - r.meanA : null),
            pValue: r?.pValue ?? null,
            significant: r?.significant ?? null,
            improvedN: r?.improvedN ?? null,
            declinedN: r?.declinedN ?? null,
            sameN: r?.sameN ?? null,
          };
        });
    const empty =
      enrolments.length === 0 && results.length === 0 && measures.length === 0;
    const classBreakdown: Record<string, number> = {};
    const trackBreakdown: Record<string, number> = {};
    for (const e of enrolments) {
      const ck = e.classLevel?.name ?? 'Unknown';
      classBreakdown[ck] = (classBreakdown[ck] ?? 0) + 1;
      const tk = e.track?.name ?? 'Unknown';
      trackBreakdown[tk] = (trackBreakdown[tk] ?? 0) + 1;
    }
    const teamCount = new Set(
      enrolments
        .map((e) => e.teamNumber)
        .filter((t) => t !== null && t !== undefined),
    ).size;
    const [interestAreas, feedback, ratingDist, feedbackItems, activities] =
      await Promise.all([
        this.interestRepo.find({ where: { campId } }),
        this.feedbackRepo.findOne({ where: { campId } }),
        this.ratingRepo.find({ where: { campId }, order: { rating: 'ASC' } }),
        this.feedbackItemRepo.find({ where: { campId } }),
        this.activityRepo.find({ where: { campId } }),
      ]);
    const ratingTotal = ratingDist.reduce(
      (s, r) => s + (r.responseCount ?? 0),
      0,
    );
    const rated45 = ratingDist
      .filter((r) => r.rating >= 4)
      .reduce((s, r) => s + (r.responseCount ?? 0), 0);
    const [
      improvements,
      projects,
      judging,
      awards,
      partners,
      expenses,
      recommendations,
    ] = await Promise.all([
      this.improvementRepo.find({ where: { campId } }),
      this.projectRepo.find({
        where: { campId },
        order: { teamNumber: 'ASC' },
      }),
      this.judgingRepo.find({ where: { campId } }),
      this.awardRepo.find({ where: { campId } }),
      this.partnerRepo.find({ where: { campId } }),
      this.expenseRepo.find({ where: { campId } }),
      this.recommendationRepo.find({ where: { campId } }),
    ]);
    const totalSpend = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
    const spendKnown = expenses.some(
      (e) => e.amount !== null && e.amount !== undefined,
    );
    return {
      camp: {
        id: camp.campId,
        type: camp.type,
        year: camp.campYear,
        theme: camp.theme ?? null,
        venue: camp.venue ?? null,
        startDate: camp.startDate ?? null,
        endDate: camp.endDate ?? null,
        durationDays: camp.durationDays ?? null,
        hasResults: !empty,
      },
      participants: empty
        ? {
            total: null,
            teams: null,
            byClass: null,
            byTrack: null,
            attendance: [],
          }
        : {
            total: enrolments.length,
            teams: teamCount || null,
            byClass: classBreakdown,
            byTrack: trackBreakdown,
            attendance: attendance.map((a) => ({
              day: a.dayNumber,
              count: a.attendanceCount ?? null,
            })),
          },
      selfEfficacy: byInstrument(ScInstrument.SELF_EFFICACY),
      assessment: {
        bothTestsN: assessment?.bothTestsN ?? null,
        perfectPreN: assessment?.perfectPreN ?? null,
        largestGain: assessment?.largestGain ?? null,
        difficultyMatched: assessment?.difficultyMatched ?? null,
        note: assessment?.note ?? null,
        knowledge: byInstrument(ScInstrument.KNOWLEDGE),
      },
      observation: {
        points: obsPoints.map((o) => ({
          pointNo: o.pointNo,
          label: o.label ?? null,
          dayNumber: o.dayNumber ?? null,
          nObserved: o.nObserved ?? null,
        })),
        measures: byInstrument(ScInstrument.OBSERVATION),
      },
      feedback: {
        invitedN: feedback?.invitedN ?? null,
        responsesN: feedback?.responsesN ?? null,
        meanSatisfaction: feedback?.meanSatisfaction ?? null,
        pct4Or5: pctFromCounts(rated45 || null, ratingTotal || null),
        invalidN: feedback?.invalidN ?? null,
        ratingDist: ratingDist.map((r) => ({
          rating: r.rating,
          count: r.responseCount,
        })),
        items: feedbackItems.map((i) => ({
          itemCode: i.itemCode,
          label: i.label ?? null,
          isCore: i.isCore,
          pctAgree: i.pctAgree ?? null,
          n: i.n ?? null,
        })),
        interestAreas: interestAreas.map((i) => ({
          area: i.areaName,
          baselinePct: i.baselinePct ?? null,
          endlinePct: i.endlinePct ?? null,
          n: i.n ?? null,
        })),
        activities: activities.map((a) => ({
          activity: a.activity,
          votes: a.votes,
        })),
        improvements: improvements.map((i) => ({
          theme: i.theme,
          mentions: i.mentions ?? null,
        })),
      },
      projects: projects.map((p) => ({
        teamNumber: p.teamNumber,
        name: p.name ?? null,
        description: p.description ?? null,
        technologies: p.technologies ?? null,
        resultPosition: p.resultPosition ?? null,
        judging: judging
          .filter((j) => j.teamNumber === p.teamNumber)
          .map((j) => ({ criterion: j.criterion, score: j.score ?? null })),
      })),
      awards: awards.map((a) => ({
        category: a.category,
        participantId: a.participantId ?? null,
        age: a.age ?? null,
      })),
      partners: partners.map((p) => ({
        org: p.partnerOrg,
        type: p.engagementType ?? null,
        dayNumber: p.dayNumber ?? null,
        repName: p.repName ?? null,
        repRole: p.repRole ?? null,
      })),
      expenses: {
        total: spendKnown ? totalSpend : null,
        currency: expenses[0]?.currency ?? 'NGN',
        lines: expenses.map((e) => ({
          category: e.category,
          amount: e.amount ?? null,
          currency: e.currency,
        })),
        costPerParticipant:
          spendKnown && enrolments.length > 0
            ? totalSpend / enrolments.length
            : null,
      },
      recommendations: recommendations.map((r) => ({
        area: r.area ?? null,
        finding: r.finding ?? null,
        recommendation: r.recommendation ?? null,
        status: r.status ?? null,
        owner: r.owner ?? null,
      })),
    };
  }
}
