import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScParticipationController } from './sc-participation.controller';
import { ScParticipationService } from './sc-participation.service';
import { ScParticipation } from './entities/sc-participation.entity';
import { SCMetric } from './entities/sc-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScParticipation,SCMetric])],
  controllers: [ScParticipationController],
  providers: [ScParticipationService],
})
export class ScParticipationModule {}
