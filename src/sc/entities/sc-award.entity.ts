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

@Entity('sc_award')
@Index(['campId'])
export class ScAward {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  category!: string;

  @Column({ type: 'integer', nullable: true })
  participantId!: number | null;

  @ManyToOne(() => ScParticipant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'participantId' })
  participant?: ScParticipant | null;

  @Column({ type: 'integer', nullable: true })
  age!: number | null;
}
