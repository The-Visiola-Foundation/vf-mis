import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScCamp } from './entities/sc-camp.entity';
import { ScClassLevel } from './entities/sc-class-level.entity';
import { ScAcademicTrack } from './entities/sc-academic-track.entity';
import { ScParticipant } from './entities/sc-participant.entity';
import { ScEnrolment } from './entities/sc-enrolment.entity';
import { ScAttendance } from './entities/sc-attendance.entity';
import { ScMeasure } from './entities/sc-measure.entity';
import { ScObsPoint } from './entities/sc-obs-point.entity';
import { ScScore } from './entities/sc-score.entity';
import { ScMeasureResult } from './entities/sc-measure-result.entity';
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
import { ScService } from './sc.service';
import { ScRollupService } from './sc-rollup.service';
import { ScResultsService } from './sc-results.service';
import { ScController } from './sc.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScCamp,
      ScClassLevel,
      ScAcademicTrack,
      ScParticipant,
      ScEnrolment,
      ScAttendance,
      ScMeasure,
      ScObsPoint,
      ScScore,
      ScMeasureResult,
      ScAssessmentSummary,
      ScInterestArea,
      ScFeedbackSummary,
      ScRatingDist,
      ScFeedbackItem,
      ScActivityVote,
      ScImprovementTheme,
      ScProject,
      ScJudgingScore,
      ScAward,
      ScPartnerEngagement,
      ScExpense,
      ScRecommendation,
    ]),
  ],
  controllers: [ScController],
  providers: [ScService, ScRollupService, ScResultsService],
  exports: [ScService, ScRollupService, ScResultsService],
})
export class ScModule {}
