import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { DuplicateEmailException, ResourceNotFoundException, UserLimitExceededException } from '../common/exceptions/custom-exceptions';
import { ConfigService } from '../config/config.service';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email, true);
    if (existingUser) {
      throw new DuplicateEmailException(`User with email ${createUserDto.email} already exists`);
    }

    const maxUsersConfig = await this.configService.getMaxUsers();
    const userCount = await this.usersRepository.countActive();

    if (userCount >= maxUsersConfig.max_users) {
      throw new UserLimitExceededException(`System has reached maximum user limit of ${maxUsersConfig.max_users}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersRepository.create(createUserDto, hashedPassword);

    return this.mapToResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => this.mapToResponseDto(user));
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundException(`User with id ${id} not found`);
    }
    return this.mapToResponseDto(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundException(`User with id ${id} not found`);
    }

    const updatedUser = await this.usersRepository.update(id, updateUserDto);
    return this.mapToResponseDto(updatedUser);
  }

  async softDelete(id: number): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundException(`User with id ${id} not found`);
    }

    await this.usersRepository.softDelete(id);
    return { message: `User with id ${id} has been soft deleted` };
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
