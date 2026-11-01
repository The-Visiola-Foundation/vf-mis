import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScParticipant } from './sc-participant.entity';
import { ScMeasure } from './sc-measure.entity';

@Entity('sc_score')
@Index(['measureId'])
@Index(['participantId'])
export class ScScore {
  @PrimaryColumn({ type: 'integer' })
  participantId!: number;

  @ManyToOne(() => ScParticipant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participantId' })
  participant!: ScParticipant;

  @PrimaryColumn({ type: 'integer' })
  measureId!: number;

  @ManyToOne(() => ScMeasure, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measureId' })
  measure!: ScMeasure;

  @PrimaryColumn({ type: 'integer' })
  pointNo!: number;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  value!: number | null;
}
