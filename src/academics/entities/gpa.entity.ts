import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AcademicTerm } from '../../common/enum';

@Entity()
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