import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AcademicTerm } from '../../common/enum';

@Entity()
@Unique(['year', 'term'])
export class GPA {
    @PrimaryGeneratedColumn('increment', { type: 'integer' })
    id!: number;

    @Column({ type: 'integer', nullable: false })
    year!: number;

    @Column({ type: 'enum', enum: AcademicTerm, nullable: false })
    term!: AcademicTerm;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: false })
    gpa!: number;

    @Column({ type: 'integer', nullable: false })
    numberOfRecords!: number;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: false })
    percentage!: number;
}