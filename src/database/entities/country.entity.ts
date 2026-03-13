import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { State } from './state.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 3, unique: true })
  code: string;

  @Column({ name: 'phone_code', length: 20, nullable: true })
  phoneCode: string | null;

  @OneToMany(() => State, (state) => state.country)
  states: State[];
}
