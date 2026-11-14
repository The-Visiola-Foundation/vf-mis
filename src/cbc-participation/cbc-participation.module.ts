import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CbcParticipationController } from './cbc-participation.controller';
import { CbcParticipationService } from './cbc-participation.service';
import { CbcParticipation } from './entities/cbc-participation.entity';
import { CbcProfile } from 'src/cbc-profile/entities/cbc-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CbcParticipation, CbcProfile])],
  controllers: [CbcParticipationController],
  providers: [CbcParticipationService],
})
export class CbcParticipationModule {}
