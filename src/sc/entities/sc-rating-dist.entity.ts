import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_rating_dist')
export class ScRatingDist {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  rating!: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  responseCount!: number;
}
