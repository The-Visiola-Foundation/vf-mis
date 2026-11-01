import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ScCamp } from './sc-camp.entity';
import { ScParticipant } from './sc-participant.entity';
import { ScClassLevel } from './sc-class-level.entity';
import { ScAcademicTrack } from './sc-academic-track.entity';

@Entity('sc_enrolment')
@Index(['campId'])
@Index(['participantId'])
export class ScEnrolment {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  participantId!: number;

  @ManyToOne(() => ScParticipant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participantId' })
  participant!: ScParticipant;

  @Column({ name: 'classLevelId', type: 'integer', nullable: true })
  classLevelId!: number | null;

  @ManyToOne(() => ScClassLevel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classLevelId' })
  classLevel?: ScClassLevel | null;

  @Column({ name: 'trackId', type: 'integer', nullable: true })
  trackId!: number | null;

  @ManyToOne(() => ScAcademicTrack, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trackId' })
  track?: ScAcademicTrack | null;

  @Column({ type: 'integer', nullable: true })
  ageAtCamp!: number | null;

  @Column({ type: 'integer', nullable: true })
  teamNumber!: number | null;

  @Column({ type: 'boolean', nullable: true })
  attendedEarlierCamp!: boolean | null;
}
