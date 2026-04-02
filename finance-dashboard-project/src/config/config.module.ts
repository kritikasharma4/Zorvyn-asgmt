import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { ConfigRepository } from './config.repository';
import { ConfigController } from './config.controller';
import { SystemConfig } from '../database/entities/system-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  providers: [ConfigService, ConfigRepository],
  controllers: [ConfigController],
  exports: [ConfigService],
})
export class ConfigModule {}
