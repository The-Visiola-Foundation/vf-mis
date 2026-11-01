import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_activity_vote')
export class ScActivityVote {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  activity!: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  votes!: number;
}
