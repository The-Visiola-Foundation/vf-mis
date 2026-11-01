import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from 'src/students/entities/student.entity';

@Entity('sc_participant')
export class ScParticipant {
  /** Stable across camps and years. */
  @PrimaryGeneratedColumn('identity')
  participantId!: number;

  @Column({ name: 'studentId', type: 'uuid', nullable: true })
  @Index()
  studentId!: string | null;

  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'studentId' })
  student?: Student | null;

  @Column({ type: 'varchar', length: 128 })
  firstName!: string;

  @Column({ type: 'varchar', length: 128 })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;
}
