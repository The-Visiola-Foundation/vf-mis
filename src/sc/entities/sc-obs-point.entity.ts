import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_obs_point')
export class ScObsPoint {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  pointNo!: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  label!: string | null;

  @Column({ type: 'integer', nullable: true })
  dayNumber!: number | null;

  @Column({ type: 'integer', nullable: true })
  nObserved!: number | null;
}
