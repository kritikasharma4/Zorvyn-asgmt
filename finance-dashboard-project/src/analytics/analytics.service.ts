import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { VisibilityConfigService } from './visibility-config.service';
import { ConfigService } from '../config/config.service';
import { SummaryDto } from './dtos/summary.dto';
import { CategoryBreakdownDto, CategoryBreakdownResponseDto } from './dtos/category-breakdown.dto';
import { TrendDto, TrendResponseDto } from './dtos/trend.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private analyticsRepository: AnalyticsRepository,
    private visibilityConfigService: VisibilityConfigService,
    private configService: ConfigService,
  ) {}

  async getUserSummary(userId: number, startDate?: Date, endDate?: Date): Promise<SummaryDto> {
    const result = await this.analyticsRepository.getUserSummary(userId, startDate, endDate);
    const currency = await this.configService.getCurrency();

    return {
      total_income: parseFloat(result.total_income) || 0,
      total_expense: parseFloat(result.total_expense) || 0,
      net_balance: (parseFloat(result.total_income) || 0) - (parseFloat(result.total_expense) || 0),
      income_count: parseInt(result.income_count) || 0,
      expense_count: parseInt(result.expense_count) || 0,
      currency: currency.currency,
    };
  }

  async getSystemSummary(startDate?: Date, endDate?: Date): Promise<SummaryDto> {
    const result = await this.analyticsRepository.getSystemSummary(startDate, endDate);
    const currency = await this.configService.getCurrency();

    return {
      total_income: parseFloat(result.total_income) || 0,
      total_expense: parseFloat(result.total_expense) || 0,
      net_balance: (parseFloat(result.total_income) || 0) - (parseFloat(result.total_expense) || 0),
      income_count: parseInt(result.income_count) || 0,
      expense_count: parseInt(result.expense_count) || 0,
      currency: currency.currency,
    };
  }

  async getUserCategoryBreakdown(userId: number, startDate?: Date, endDate?: Date): Promise<CategoryBreakdownResponseDto> {
    const results = await this.analyticsRepository.getUserCategoryBreakdown(userId, startDate, endDate);
    const currency = await this.configService.getCurrency();

    const totalAmount = results.reduce((sum, row) => {
      return sum + (parseFloat(row.income) || 0) + (parseFloat(row.expense) || 0);
    }, 0);

    const breakdown: CategoryBreakdownDto[] = results.map((row) => {
      const income = parseFloat(row.income) || 0;
      const expense = parseFloat(row.expense) || 0;
      const net = income - expense;
      const percentage = totalAmount > 0 ? (Math.abs(net) / totalAmount) * 100 : 0;

      return {
        category: row.category,
        income,
        expense,
        net,
        percentage: Math.round(percentage * 100) / 100,
        count: parseInt(row.count) || 0,
      };
    });

    return {
      data: breakdown,
      total_amount: totalAmount,
      currency: currency.currency,
    };
  }

  async getSystemCategoryBreakdown(startDate?: Date, endDate?: Date): Promise<CategoryBreakdownResponseDto> {
    const results = await this.analyticsRepository.getSystemCategoryBreakdown(startDate, endDate);
    const currency = await this.configService.getCurrency();

    const totalAmount = results.reduce((sum, row) => {
      return sum + (parseFloat(row.income) || 0) + (parseFloat(row.expense) || 0);
    }, 0);

    const breakdown: CategoryBreakdownDto[] = results.map((row) => {
      const income = parseFloat(row.income) || 0;
      const expense = parseFloat(row.expense) || 0;
      const net = income - expense;
      const percentage = totalAmount > 0 ? (Math.abs(net) / totalAmount) * 100 : 0;

      return {
        category: row.category,
        income,
        expense,
        net,
        percentage: Math.round(percentage * 100) / 100,
        count: parseInt(row.count) || 0,
      };
    });

    return {
      data: breakdown,
      total_amount: totalAmount,
      currency: currency.currency,
    };
  }

  async getUserTrends(userId: number, startDate?: Date, endDate?: Date): Promise<TrendResponseDto> {
    const results = await this.analyticsRepository.getUserTrends(userId, startDate, endDate);
    const currency = await this.configService.getCurrency();

    const trends: TrendDto[] = results.map((row) => ({
      date: new Date(row.date),
      income: parseFloat(row.income) || 0,
      expense: parseFloat(row.expense) || 0,
      net: (parseFloat(row.income) || 0) - (parseFloat(row.expense) || 0),
    }));

    return {
      data: trends,
      start_date: startDate,
      end_date: endDate,
      currency: currency.currency,
    };
  }

  async getSystemTrends(startDate?: Date, endDate?: Date): Promise<TrendResponseDto> {
    const results = await this.analyticsRepository.getSystemTrends(startDate, endDate);
    const currency = await this.configService.getCurrency();

    const trends: TrendDto[] = results.map((row) => ({
      date: new Date(row.date),
      income: parseFloat(row.income) || 0,
      expense: parseFloat(row.expense) || 0,
      net: (parseFloat(row.income) || 0) - (parseFloat(row.expense) || 0),
    }));

    return {
      data: trends,
      start_date: startDate,
      end_date: endDate,
      currency: currency.currency,
    };
  }
}
