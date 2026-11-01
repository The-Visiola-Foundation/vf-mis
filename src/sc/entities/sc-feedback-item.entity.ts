import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_feedback_item')
export class ScFeedbackItem {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'varchar', length: 64 })
  itemCode!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label!: string | null;

  @Column({ type: 'boolean', default: false })
  isCore!: boolean;

  /** Counts stored; agreement % derived in service. Legacy pct input kept nullable. */
  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  pctAgree!: number | null;

  @Column({ type: 'integer', nullable: true })
  n!: number | null;
}
