import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_improvement_theme')
export class ScImprovementTheme {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  theme!: string;

  @Column({ type: 'integer', nullable: true })
  mentions!: number | null;
}
