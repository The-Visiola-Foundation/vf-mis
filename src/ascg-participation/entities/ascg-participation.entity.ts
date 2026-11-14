import { Program } from 'src/common/enum';
import { Student } from 'src/students/entities/student.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('ascg_participations')
@Unique(['studentId', 'schoolId', 'type', 'year'])
export class AscgParticipation {
  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column({ name: 'studentId', type: 'uuid', nullable: false })
  studentId!: string;

  @Column({ name: 'schoolId', type: 'uuid', nullable: false })
  schoolId!: string;

  @Column({ type: 'simple-enum', enum: Program, default: Program.ASCG, nullable: false })
  type!: Program;

  @Column({ type: 'varchar', nullable: true })
  class?: string;

  @ManyToOne(() => Student, (student) => student.ascgParticipation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'integer', nullable: false })
  year!: number;
}
