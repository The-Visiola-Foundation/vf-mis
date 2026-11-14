import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';
import { Academics } from './entities/academics.entity';
import { GPA } from './entities/gpa.entity';
import { Grade } from './entities/grades.entity';
import { Performance } from './entities/performance.entity';
import { AscgParticipation } from 'src/ascg-participation/entities/ascg-participation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Academics, GPA, Grade, Performance, AscgParticipation])],
  controllers: [AcademicsController],
  providers: [AcademicsService],
})
export class AcademicsModule { }
