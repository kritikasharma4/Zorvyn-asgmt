import { IsDecimal, IsEnum, IsString, IsDate, IsOptional, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecordDto {
  @IsDecimal({ decimal_digits: '1,2' })
  amount: number;

  @IsEnum(['income', 'expense'], {
    message: 'type must be either income or expense',
  })
  type: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsString()
  currency: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}
