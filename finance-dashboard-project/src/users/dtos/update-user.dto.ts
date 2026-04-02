import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsEnum(['active', 'inactive'], {
    message: 'status must be one of: active, inactive',
  })
  @IsOptional()
  status?: string;

  @IsEnum(['viewer', 'analyst', 'admin'], {
    message: 'role must be one of: viewer, analyst, admin',
  })
  @IsOptional()
  role?: string;
}
