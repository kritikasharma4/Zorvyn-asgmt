import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/interfaces';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get financial summary for current user' })
  @ApiResponse({
    status: 200,
    description: 'User financial summary',
    schema: {
      example: {
        total_income: 5000,
        total_expense: 2000,
        net_balance: 3000,
        income_count: 10,
        expense_count: 15,
        currency: 'USD',
      },
    },
  })
  async getSummary(@Req() request: AuthenticatedRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getUserSummary(request.user.id, start, end);
  }

  @Get('category-breakdown')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get category breakdown for current user' })
  @ApiResponse({
    status: 200,
    description: 'Category breakdown with percentages',
  })
  async getCategoryBreakdown(@Req() request: AuthenticatedRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getUserCategoryBreakdown(request.user.id, start, end);
  }

  @Get('trends')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get income/expense trends for current user' })
  @ApiResponse({
    status: 200,
    description: 'Daily trends data',
  })
  async getTrends(@Req() request: AuthenticatedRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getUserTrends(request.user.id, start, end);
  }
}
