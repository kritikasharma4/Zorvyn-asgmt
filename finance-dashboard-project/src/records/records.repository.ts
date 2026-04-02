import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../database/entities/record.entity';
import { CreateRecordDto } from './dtos/create-record.dto';
import { RecordFilterDto } from './dtos/record-filter.dto';

@Injectable()
export class RecordsRepository {
  constructor(
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
  ) {}

  async create(userId: number, createRecordDto: CreateRecordDto): Promise<Record> {
    const record = this.recordRepository.create({
      user_id: userId,
      ...createRecordDto,
      is_deleted: false,
    });
    return await this.recordRepository.save(record);
  }

  async findByIdAndUser(id: number, userId: number): Promise<Record> {
    return await this.recordRepository.findOne({
      where: { id, user_id: userId, is_deleted: false },
    });
  }

  async findById(id: number): Promise<Record> {
    return await this.recordRepository.findOne({
      where: { id, is_deleted: false },
    });
  }

  async findUserRecords(userId: number, filters: RecordFilterDto): Promise<[Record[], number]> {
    const query = this.recordRepository.createQueryBuilder('record').where('record.user_id = :userId', { userId }).andWhere('record.is_deleted = :is_deleted', { is_deleted: false });

    if (filters.type) {
      query.andWhere('record.type = :type', { type: filters.type });
    }

    if (filters.category) {
      query.andWhere('record.category = :category', { category: filters.category });
    }

    if (filters.startDate) {
      query.andWhere('record.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('record.date <= :endDate', { endDate: filters.endDate });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    query.orderBy('record.date', 'DESC').skip(skip).take(limit);

    return await query.getManyAndCount();
  }

  async findAllRecords(filters: RecordFilterDto): Promise<[Record[], number]> {
    const query = this.recordRepository.createQueryBuilder('record').where('record.is_deleted = :is_deleted', { is_deleted: false });

    if (filters.type) {
      query.andWhere('record.type = :type', { type: filters.type });
    }

    if (filters.category) {
      query.andWhere('record.category = :category', { category: filters.category });
    }

    if (filters.startDate) {
      query.andWhere('record.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('record.date <= :endDate', { endDate: filters.endDate });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    query.orderBy('record.date', 'DESC').skip(skip).take(limit);

    return await query.getManyAndCount();
  }

  async update(id: number, updates: Partial<Record>): Promise<Record> {
    await this.recordRepository.update(id, updates);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.recordRepository.update(id, { is_deleted: true });
  }
}
