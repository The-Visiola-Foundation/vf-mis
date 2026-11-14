import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['year'])
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