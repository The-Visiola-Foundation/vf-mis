import { Column, Entity, PrimaryColumn, Unique } from "typeorm";

@Entity('programs')
@Unique(['id', 'program'])
export class Program {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    id!: string;

    @Column({ type: 'varchar', length: 128, nullable: false })
    program!: string;

    @Column({ type: 'text', nullable: false })
    description!: string;
}
