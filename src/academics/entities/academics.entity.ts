import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Academics {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: number;

  @Column({ type: 'integer', nullable: false })
  year!: number;

  @Column({ type: 'integer', nullable: false })
  improved!: number;

  @Column({ type: 'integer', nullable: false })
  stable!: number;

  @Column({ type: 'integer', nullable: false })
  declined!: number;
}