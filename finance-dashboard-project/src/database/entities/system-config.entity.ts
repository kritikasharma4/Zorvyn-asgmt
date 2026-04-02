import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
