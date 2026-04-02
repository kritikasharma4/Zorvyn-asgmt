import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { ResourceNotFoundException } from '../common/exceptions/custom-exceptions';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return await this.categoriesRepository.create(createCategoryDto);
  }

  async findAll() {
    return await this.categoriesRepository.findAll();
  }

  async findById(id: number) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new ResourceNotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findByName(name: string) {
    const category = await this.categoriesRepository.findByName(name);
    if (!category) {
      throw new ResourceNotFoundException(`Category with name ${name} not found`);
    }
    return category;
  }
}
