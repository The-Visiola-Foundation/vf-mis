import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_recommendation')
@Index(['campId'])
export class ScRecommendation {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @Column({ type: 'varchar', length: 128, nullable: true })
  area!: string | null;

  @Column({ type: 'text', nullable: true })
  finding!: string | null;

  @Column({ type: 'text', nullable: true })
  recommendation!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  status!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner!: string | null;
}
