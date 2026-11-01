import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('sc_academic_track')
@Unique(['name'])
export class ScAcademicTrack {
  @PrimaryGeneratedColumn('identity')
  trackId!: number;

  @Column({ type: 'varchar', length: 32 })
  name!: string;
}
