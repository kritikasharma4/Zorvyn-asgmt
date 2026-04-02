import { IsString, Length, Matches } from 'class-validator';

export class SetCurrencyDto {
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid 3-letter ISO 4217 code (e.g., USD, EUR, GBP)',
  })
  currency: string;
}
