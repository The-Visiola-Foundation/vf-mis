import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/students/entities/student.entity';
import { School } from 'src/schools/entities/school.entity';
import { AscgParticipation } from 'src/ascg-participation/entities/ascg-participation.entity';
import { CbcParticipation } from 'src/cbc-participation/entities/cbc-participation.entity';
import { ScParticipation } from 'src/sc-participation/entities/sc-participation.entity';
import { AscgProfile } from 'src/ascg-profile/entities/ascg-profile.entity';
import { Academics } from 'src/academics/entities/academics.entity';
import { Track } from 'src/tracks/entities/track.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      Student,
      School,
      AscgParticipation,
      CbcParticipation,
      ScParticipation,
      AscgProfile,
      Academics,
      Track
    ])
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
