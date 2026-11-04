import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: number;

  @Column({ type: 'integer', nullable: false })
  year!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  subject!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  paired!: string;

  @Column({ type: 'integer', nullable: false })
  term1!: number;

  @Column({ type: 'integer', nullable: false })
  term2!: number;

  @Column({ type: 'integer', nullable: false })
  term3!: number;

  @Column({ type: 'integer', nullable: false })
  improved!: number;

  @Column({ type: 'integer', nullable: false })
  stable!: number;

  @Column({ type: 'integer', nullable: false })
  declined!: number;
}