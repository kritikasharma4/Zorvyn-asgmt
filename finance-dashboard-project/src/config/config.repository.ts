import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../database/entities/system-config.entity';

@Injectable()
export class ConfigRepository {
  constructor(
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async getMaxUsers(): Promise<number> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'max_users' },
    });
    return config ? parseInt(config.value) : 100;
  }

  async setMaxUsers(maxUsers: number): Promise<SystemConfig> {
    let config = await this.systemConfigRepository.findOne({
      where: { key: 'max_users' },
    });

    if (!config) {
      config = this.systemConfigRepository.create({
        key: 'max_users',
        value: maxUsers.toString(),
      });
    } else {
      config.value = maxUsers.toString();
    }

    return await this.systemConfigRepository.save(config);
  }

  async getCurrency(): Promise<string> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'system_currency' },
    });
    return config ? config.value : 'USD';
  }

  async setCurrency(currency: string): Promise<SystemConfig> {
    let config = await this.systemConfigRepository.findOne({
      where: { key: 'system_currency' },
    });

    if (!config) {
      config = this.systemConfigRepository.create({
        key: 'system_currency',
        value: currency,
      });
    } else {
      config.value = currency;
    }

    return await this.systemConfigRepository.save(config);
  }
}
