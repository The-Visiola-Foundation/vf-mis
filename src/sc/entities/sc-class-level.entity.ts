import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('sc_class_level')
@Unique(['name'])
export class ScClassLevel {
  @PrimaryGeneratedColumn('identity')
  classLevelId!: number;

  @Column({ type: 'varchar', length: 16 })
  name!: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;
}
