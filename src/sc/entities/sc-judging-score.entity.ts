import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ColumnNumericTransformer } from 'src/common/transformers/numeric.transformer';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_judging_score')
export class ScJudgingScore {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  teamNumber!: number;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  criterion!: string;

  @Column({
    type: 'numeric',
    transformer: ColumnNumericTransformer,
    nullable: true,
  })
  score!: number | null;
}
