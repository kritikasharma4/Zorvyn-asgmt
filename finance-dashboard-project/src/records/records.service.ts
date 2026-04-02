import { Injectable } from '@nestjs/common';
import { RecordsRepository } from './records.repository';
import { CreateRecordDto } from './dtos/create-record.dto';
import { UpdateRecordDto } from './dtos/update-record.dto';
import { RecordFilterDto } from './dtos/record-filter.dto';
import { RecordResponseDto } from './dtos/record-response.dto';
import { ResourceNotFoundException, ValidationException, CurrencyMismatchException, ImmutableFieldException } from '../common/exceptions/custom-exceptions';
import { ConfigService } from '../config/config.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class RecordsService {
  constructor(
    private recordsRepository: RecordsRepository,
    private configService: ConfigService,
    private categoriesService: CategoriesService,
  ) {}

  async create(userId: number, createRecordDto: CreateRecordDto): Promise<RecordResponseDto> {
    // Validate category exists
    await this.categoriesService.findByName(createRecordDto.category);

    // Validate currency matches system currency
    const systemCurrency = await this.configService.getCurrency();
    if (createRecordDto.currency !== systemCurrency.currency) {
      throw new CurrencyMismatchException(
        `Record currency ${createRecordDto.currency} does not match system currency ${systemCurrency.currency}`,
      );
    }

    const record = await this.recordsRepository.create(userId, createRecordDto);
    return this.mapToResponseDto(record);
  }

  async findUserRecord(userId: number, recordId: number): Promise<RecordResponseDto> {
    const record = await this.recordsRepository.findByIdAndUser(recordId, userId);
    if (!record) {
      throw new ResourceNotFoundException(`Record with id ${recordId} not found`);
    }
    return this.mapToResponseDto(record);
  }

  async findUserRecords(userId: number, filters: RecordFilterDto): Promise<{ data: RecordResponseDto[]; total: number; page: number; limit: number }> {
    const [records, total] = await this.recordsRepository.findUserRecords(userId, filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    return {
      data: records.map((record) => this.mapToResponseDto(record)),
      total,
      page,
      limit,
    };
  }

  async findAllRecords(filters: RecordFilterDto): Promise<{ data: RecordResponseDto[]; total: number; page: number; limit: number }> {
    const [records, total] = await this.recordsRepository.findAllRecords(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    return {
      data: records.map((record) => this.mapToResponseDto(record)),
      total,
      page,
      limit,
    };
  }

  async update(userId: number, recordId: number, updateRecordDto: UpdateRecordDto): Promise<RecordResponseDto> {
    const record = await this.recordsRepository.findByIdAndUser(recordId, userId);
    if (!record) {
      throw new ResourceNotFoundException(`Record with id ${recordId} not found`);
    }

    // Only amount and notes can be updated
    const updates: any = {};

    if (updateRecordDto.amount !== undefined) {
      updates.amount = updateRecordDto.amount;
    }

    if (updateRecordDto.notes !== undefined) {
      updates.notes = updateRecordDto.notes;
    }

    const updatedRecord = await this.recordsRepository.update(recordId, updates);
    return this.mapToResponseDto(updatedRecord);
  }

  async softDelete(userId: number, recordId: number): Promise<{ message: string }> {
    const record = await this.recordsRepository.findByIdAndUser(recordId, userId);
    if (!record) {
      throw new ResourceNotFoundException(`Record with id ${recordId} not found`);
    }

    await this.recordsRepository.softDelete(recordId);
    return { message: `Record with id ${recordId} has been soft deleted` };
  }

  private mapToResponseDto(record: any): RecordResponseDto {
    return {
      id: record.id,
      user_id: record.user_id,
      amount: record.amount,
      type: record.type,
      category: record.category,
      currency: record.currency,
      date: record.date,
      notes: record.notes,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
