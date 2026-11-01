import { Student } from "src/students/entities/student.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('ascg_participations')
@Unique(['studentId', 'schoolId', 'year'])
export class AscgParticipation {
    @PrimaryGeneratedColumn('identity')
    id!: number;

    @Column({ name: 'studentId', type: 'uuid', nullable: false })
    studentId!: string;

    @Column({ name: 'schoolId', type: 'uuid', nullable: false })
    schoolId!: string;

    @Column({ type: 'varchar', nullable: true })
    class?: string;

    @ManyToOne(() => Student, (student) => student.ascgParticipation, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student!: Student;

    @Column({ type: 'integer' })
    year!: number;
}
