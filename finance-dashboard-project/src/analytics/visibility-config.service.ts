import { Injectable } from '@nestjs/common';
import { VisibilityConfigRepository } from './visibility-config.repository';
import { VisibilityConfigDto, UpdateVisibilityConfigDto } from './dtos/visibility-config.dto';

@Injectable()
export class VisibilityConfigService {
  constructor(private visibilityConfigRepository: VisibilityConfigRepository) {}

  async findAll(): Promise<VisibilityConfigDto[]> {
    const configs = await this.visibilityConfigRepository.findAll();
    return configs.map((config) => ({
      field_name: config.field_name,
      is_visible: config.is_visible,
    }));
  }

  async update(updateVisibilityConfigDto: UpdateVisibilityConfigDto): Promise<VisibilityConfigDto> {
    const config = await this.visibilityConfigRepository.update(
      updateVisibilityConfigDto.field_name,
      updateVisibilityConfigDto.is_visible,
    );
    return {
      field_name: config.field_name,
      is_visible: config.is_visible,
    };
  }

  async isFieldVisible(fieldName: string): Promise<boolean> {
    return await this.visibilityConfigRepository.isFieldVisible(fieldName);
  }
}
