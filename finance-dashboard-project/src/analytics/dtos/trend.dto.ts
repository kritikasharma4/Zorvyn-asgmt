export class TrendDto {
  date: Date;
  income: number;
  expense: number;
  net: number;
}

export class TrendResponseDto {
  data: TrendDto[];
  start_date?: Date;
  end_date?: Date;
  currency: string;
}
