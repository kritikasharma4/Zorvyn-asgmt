import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../database/entities/record.entity';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
  ) {}

  async getUserSummary(userId: number, startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'total_income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'total_expense')
      .addSelect('COUNT(CASE WHEN record.type = :incomeType THEN 1 END)', 'income_count')
      .addSelect('COUNT(CASE WHEN record.type = :expenseType THEN 1 END)', 'expense_count')
      .where('record.user_id = :userId', { userId })
      .andWhere('record.is_deleted = :is_deleted', { is_deleted: false })
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawOne();
  }

  async getSystemSummary(startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'total_income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'total_expense')
      .addSelect('COUNT(CASE WHEN record.type = :incomeType THEN 1 END)', 'income_count')
      .addSelect('COUNT(CASE WHEN record.type = :expenseType THEN 1 END)', 'expense_count')
      .where('record.is_deleted = :is_deleted', { is_deleted: false })
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawOne();
  }

  async getUserCategoryBreakdown(userId: number, startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('record.category', 'category')
      .addSelect('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'expense')
      .addSelect('COUNT(*)', 'count')
      .where('record.user_id = :userId', { userId })
      .andWhere('record.is_deleted = :is_deleted', { is_deleted: false })
      .groupBy('record.category')
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }

  async getSystemCategoryBreakdown(startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('record.category', 'category')
      .addSelect('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'expense')
      .addSelect('COUNT(*)', 'count')
      .where('record.is_deleted = :is_deleted', { is_deleted: false })
      .groupBy('record.category')
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }

  async getUserTrends(userId: number, startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('DATE(record.date)', 'date')
      .addSelect('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'expense')
      .where('record.user_id = :userId', { userId })
      .andWhere('record.is_deleted = :is_deleted', { is_deleted: false })
      .groupBy('DATE(record.date)')
      .orderBy('record.date', 'ASC')
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }

  async getSystemTrends(startDate?: Date, endDate?: Date) {
    const query = this.recordRepository
      .createQueryBuilder('record')
      .select('DATE(record.date)', 'date')
      .addSelect('SUM(CASE WHEN record.type = :incomeType THEN record.amount ELSE 0 END)', 'income')
      .addSelect('SUM(CASE WHEN record.type = :expenseType THEN record.amount ELSE 0 END)', 'expense')
      .where('record.is_deleted = :is_deleted', { is_deleted: false })
      .groupBy('DATE(record.date)')
      .orderBy('record.date', 'ASC')
      .setParameter('incomeType', 'income')
      .setParameter('expenseType', 'expense');

    if (startDate) {
      query.andWhere('record.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.date <= :endDate', { endDate });
    }

    return await query.getRawMany();
  }
}
