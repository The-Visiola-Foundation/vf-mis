import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_expense')
@Index(['campId'])
export class ScExpense {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @Column({ type: 'varchar', length: 128 })
  category!: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  amount!: number | null;

  @Column({ type: 'char', length: 3, default: 'NGN' })
  currency!: string;
}
