import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
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
  role?: string = 'analyst';
}
