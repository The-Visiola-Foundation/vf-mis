import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { CampType } from 'src/common/enum';

@Entity('sc_camp')
@Unique(['type', 'campYear'])
export class ScCamp {
  /** Text PK like '2026-SUMMER' / '2026-DECEMBER'. */
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @Column({ type: 'simple-enum', enum: CampType, nullable: false })
  type!: CampType;

  @Column({ type: 'integer', nullable: false })
  @Index()
  campYear!: number;

  @Column({ type: 'text', nullable: true })
  theme!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  venue!: string | null;

  @Column({ type: 'date', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'integer', nullable: true })
  durationDays!: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  cohortType!: string | null;

  @Column({ type: 'date', nullable: true })
  reportDate!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  preparedBy!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  submittedTo!: string | null;
}
