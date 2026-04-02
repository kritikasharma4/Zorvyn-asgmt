import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { VisibilityConfigService } from './visibility-config.service';
import { UpdateVisibilityConfigDto } from './dtos/visibility-config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin/analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private visibilityConfigService: VisibilityConfigService,
  ) {}

  @Get('summary')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system-wide financial summary (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System financial summary across all users',
    schema: {
      example: {
        total_income: 50000,
        total_expense: 20000,
        net_balance: 30000,
        income_count: 100,
        expense_count: 150,
        currency: 'USD',
      },
    },
  })
  async getSystemSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getSystemSummary(start, end);
  }

  @Get('category-breakdown')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system-wide category breakdown (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System category breakdown across all users',
  })
  async getSystemCategoryBreakdown(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getSystemCategoryBreakdown(start, end);
  }

  @Get('trends')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system-wide trends (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System trends across all users',
  })
  async getSystemTrends(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.analyticsService.getSystemTrends(start, end);
  }

  @Get('visibility-config')
  @Roles('admin')
  @ApiOperation({ summary: 'Get analyst field visibility config (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all visibility configurations',
    schema: {
      example: [
        {
          field_name: 'user_email',
          is_visible: true,
        },
      ],
    },
  })
  async getVisibilityConfig() {
    return await this.visibilityConfigService.findAll();
  }

  @Post('visibility-config')
  @Roles('admin')
  @ApiOperation({ summary: 'Update analyst field visibility config (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Visibility configuration updated',
  })
  async updateVisibilityConfig(@Body() updateVisibilityConfigDto: UpdateVisibilityConfigDto) {
    return await this.visibilityConfigService.update(updateVisibilityConfigDto);
  }
}
