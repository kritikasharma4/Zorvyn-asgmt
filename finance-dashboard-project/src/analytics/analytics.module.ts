import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsController } from './analytics.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { VisibilityConfigService } from './visibility-config.service';
import { VisibilityConfigRepository } from './visibility-config.repository';
import { Record } from '../database/entities/record.entity';
import { VisibilityConfig } from '../database/entities/visibility-config.entity';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([Record, VisibilityConfig]), ConfigModule],
  providers: [AnalyticsService, AnalyticsRepository, VisibilityConfigService, VisibilityConfigRepository],
  controllers: [AnalyticsController, AdminAnalyticsController],
  exports: [AnalyticsService, VisibilityConfigService],
})
export class AnalyticsModule {}
