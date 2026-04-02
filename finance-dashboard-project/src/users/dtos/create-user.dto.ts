import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(['viewer', 'analyst', 'admin'], {
    message: 'role must be one of: viewer, analyst, admin',
  })
  @IsOptional()
  role?: string = 'analyst';
}
