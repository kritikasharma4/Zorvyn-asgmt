import { IsOptional, IsEnum, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordFilterDto {
  @IsEnum(['income', 'expense'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}
