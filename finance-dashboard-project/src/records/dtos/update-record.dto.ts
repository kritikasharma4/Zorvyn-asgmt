import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class UpdateRecordDto {
  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
