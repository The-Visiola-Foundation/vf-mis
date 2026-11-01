import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_assessment_summary')
export class ScAssessmentSummary {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @OneToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @Column({ type: 'integer', nullable: true })
  bothTestsN!: number | null;

  @Column({ type: 'integer', nullable: true })
  perfectPreN!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  largestGain!: number | null;

  @Column({ type: 'boolean', nullable: true })
  difficultyMatched!: boolean | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;
}
