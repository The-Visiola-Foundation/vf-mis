import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_partner_engagement')
@Index(['campId'])
export class ScPartnerEngagement {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @Column({ type: 'varchar', length: 255 })
  partnerOrg!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  engagementType!: string | null;

  @Column({ type: 'integer', nullable: true })
  dayNumber!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  repName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  repRole!: string | null;
}
