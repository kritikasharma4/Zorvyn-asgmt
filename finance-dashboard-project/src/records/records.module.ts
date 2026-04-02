import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsService } from './records.service';
import { RecordsRepository } from './records.repository';
import { RecordsController } from './records.controller';
import { Record } from '../database/entities/record.entity';
import { ConfigModule } from '../config/config.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Record]), ConfigModule, CategoriesModule],
  providers: [RecordsService, RecordsRepository],
  controllers: [RecordsController],
  exports: [RecordsService],
})
export class RecordsModule {}
