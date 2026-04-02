export class CategoryBreakdownDto {
  category: string;
  income: number;
  expense: number;
  net: number;
  percentage: number;
  count: number;
}

export class CategoryBreakdownResponseDto {
  data: CategoryBreakdownDto[];
  total_amount: number;
  currency: string;
}
