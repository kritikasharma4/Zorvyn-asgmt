import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, hashedPassword: string): Promise<User> {
    const user = this.userRepository.create({
      email: createUserDto.email,
      password_hash: hashedPassword,
      name: createUserDto.name,
      role: createUserDto.role || 'analyst',
      status: 'active',
      is_deleted: false,
    });
    return await this.userRepository.save(user);
  }

  async findAll(includeDeleted: boolean = false): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (!includeDeleted) {
      query.where('user.is_deleted = :is_deleted', { is_deleted: false });
    }

    return await query.orderBy('user.created_at', 'DESC').getMany();
  }

  async findById(id: number, includeDeleted: boolean = false): Promise<User> {
    const query = this.userRepository.createQueryBuilder('user').where('user.id = :id', { id });

    if (!includeDeleted) {
      query.andWhere('user.is_deleted = :is_deleted', { is_deleted: false });
    }

    return await query.getOne();
  }

  async findByEmail(email: string, includeDeleted: boolean = false): Promise<User> {
    const query = this.userRepository.createQueryBuilder('user').where('user.email = :email', { email });

    if (!includeDeleted) {
      query.andWhere('user.is_deleted = :is_deleted', { is_deleted: false });
    }

    return await query.getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.userRepository.update(id, { is_deleted: true });
  }

  async countActive(): Promise<number> {
    return await this.userRepository.count({
      where: { is_deleted: false },
    });
  }
}
