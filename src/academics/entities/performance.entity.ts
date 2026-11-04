import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AcademicTerm } from '../../common/enum';

@Entity()
export class Performance {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: number;

  @Column({ type: 'integer', nullable: false })
  year!: number;

  @Column({ type: 'enum', enum: AcademicTerm, nullable: false })
  term!: AcademicTerm;

  @Column({ type: 'integer', nullable: false })
  excellent!: number;

  @Column({ type: 'integer', nullable: false })
  good!: number;

  @Column({ type: 'integer', nullable: false })
  fair!: number;

  @Column({ type: 'integer', nullable: false })
  poor!: number;
}