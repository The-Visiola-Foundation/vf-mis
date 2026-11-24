import { CampType } from "frontend/dtos";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";


export enum MetricCategory {
    CORE = 'Core',
    CAMP_SPECIFIC = 'Camp-specific',
}


@Entity('sc_metrics')
@Unique(['year', 'metricName', 'type'])
export class SCMetric {
    @PrimaryGeneratedColumn('identity')
    id!: number;

    @Column()
    year!: number;

    @Column({ type: 'simple-enum', enum: CampType, nullable: false })
    type!: CampType;

    @Column({ type: 'varchar', nullable: false })
    metricName!: string;

    @Column({
        type: 'simple-enum',
        enum: MetricCategory,
        nullable: false,
        default: MetricCategory.CORE
    })
    category!: MetricCategory;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    baselineScore?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    endlineScore?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    change?: number;

    @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
    pValue?: number;

    @Column({ type: 'integer', nullable: true })
    count?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    improved?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    stable?: number | null

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    declined?: number | null
}