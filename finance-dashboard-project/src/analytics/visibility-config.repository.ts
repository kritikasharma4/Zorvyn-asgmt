import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisibilityConfig } from '../database/entities/visibility-config.entity';

@Injectable()
export class VisibilityConfigRepository {
  constructor(
    @InjectRepository(VisibilityConfig)
    private visibilityConfigRepository: Repository<VisibilityConfig>,
  ) {}

  async findAll(): Promise<VisibilityConfig[]> {
    return await this.visibilityConfigRepository.find({
      order: { field_name: 'ASC' },
    });
  }

  async findByFieldName(fieldName: string): Promise<VisibilityConfig | null> {
    return await this.visibilityConfigRepository.findOne({
      where: { field_name: fieldName },
    });
  }

  async update(fieldName: string, isVisible: boolean): Promise<VisibilityConfig> {
    let config = await this.findByFieldName(fieldName);

    if (!config) {
      config = this.visibilityConfigRepository.create({
        field_name: fieldName,
        is_visible: isVisible,
      });
    } else {
      config.is_visible = isVisible;
    }

    return await this.visibilityConfigRepository.save(config);
  }

  async isFieldVisible(fieldName: string): Promise<boolean> {
    const config = await this.findByFieldName(fieldName);
    return config ? config.is_visible : true;
  }
}
