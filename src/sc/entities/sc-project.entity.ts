import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_project')
@Index(['campId'])
export class ScProject {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  teamNumber!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  technologies!: string[] | null;

  @Column({ type: 'integer', nullable: true })
  resultPosition!: number | null;
}
