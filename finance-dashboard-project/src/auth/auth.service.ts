import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { InvalidCredentialsException, DuplicateEmailException, UserLimitExceededException } from '../common/exceptions/custom-exceptions';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemConfig } from '../database/entities/system-config.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new DuplicateEmailException(`User with email ${email} already exists`);
    }

    const maxUsersConfig = await this.systemConfigRepository.findOne({
      where: { key: 'max_users' },
    });
    const maxUsers = maxUsersConfig ? parseInt(maxUsersConfig.value) : 100;

    const userCount = await this.userRepository.count({ where: { is_deleted: false } });
    if (userCount >= maxUsers) {
      throw new UserLimitExceededException(`System has reached maximum user limit of ${maxUsers}`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      name,
      role: role || 'analyst',
      status: 'active',
      is_deleted: false,
    });

    await this.userRepository.save(newUser);

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.is_deleted) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    if (user.status === 'inactive') {
      throw new InvalidCredentialsException('User account is inactive');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.is_deleted) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    if (user.status === 'inactive') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
