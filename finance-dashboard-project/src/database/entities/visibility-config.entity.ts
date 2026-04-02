import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('analyst_visibility_config')
export class VisibilityConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  field_name: string;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
