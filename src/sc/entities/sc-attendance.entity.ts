import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ScCamp } from './sc-camp.entity';

@Entity('sc_attendance')
export class ScAttendance {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  campId!: string;

  @ManyToOne(() => ScCamp, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campId' })
  camp!: ScCamp;

  @PrimaryColumn({ type: 'integer' })
  dayNumber!: number;

  @Column({ type: 'integer', nullable: true })
  attendanceCount!: number | null;
}
