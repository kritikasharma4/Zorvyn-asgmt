import { IsNumber, Min, Max } from 'class-validator';

export class SetMaxUsersDto {
  @IsNumber()
  @Min(1)
  @Max(10000)
  max_users: number;
}
