import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';
import { ScInstrument } from '../sc-instrument.enum';

@Entity('sc_measure')
@Unique(['campId', 'coreCode'])
@Index(['campId'])
export class ScMeasure {
  @PrimaryGeneratedColumn('identity')
  measureId!: number;

  @Column({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  /** Stable core code, unique within a camp; null for camp-specific measures. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  coreCode!: string | null;

  @Column({ type: 'varchar', length: 32 })
  instrument!: ScInstrument;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  category!: string | null;

  @Column({ type: 'boolean', default: false })
  isCore!: boolean;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  scaleMin!: number | null;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  scaleMax!: number | null;
}
