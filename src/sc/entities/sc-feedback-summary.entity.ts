import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_feedback_summary')
export class ScFeedbackSummary {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @OneToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @Column({ type: 'integer', nullable: true })
  invitedN!: number | null;

  @Column({ type: 'integer', nullable: true })
  responsesN!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  meanSatisfaction!: number | null;

  @Column({ type: 'integer', nullable: true })
  invalidN!: number | null;
}
