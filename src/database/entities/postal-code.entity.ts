import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { City } from './city.entity';

@Entity('postal_codes')
@Index('IDX_postal_city', ['cityId'])
export class PostalCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  code: string;

  @Column({ name: 'area_name', length: 200, nullable: true })
  areaName: string | null;

  @Column({ name: 'city_id' })
  cityId: number;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city: City;
}
