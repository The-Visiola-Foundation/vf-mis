import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';
import { ScMeasure } from './sc-measure.entity';

@Entity('sc_measure_result')
@Index(['campId'])
export class ScMeasureResult {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  measureId!: number;

  @ManyToOne(() => ScMeasure, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measureId' })
  measure!: ScMeasure;

  @Column({ type: 'integer', nullable: true })
  n!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  meanA!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  meanB!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  change!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  pValue!: number | null;

  @Column({ type: 'boolean', nullable: true })
  significant!: boolean | null;

  @Column({ type: 'integer', nullable: true })
  improvedN!: number | null;

  @Column({ type: 'integer', nullable: true })
  declinedN!: number | null;

  @Column({ type: 'integer', nullable: true })
  sameN!: number | null;
}
