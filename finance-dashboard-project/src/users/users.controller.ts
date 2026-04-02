import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        role: 'analyst',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists or user limit reached',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('analyst', 'admin')
  @ApiOperation({ summary: 'Get all users (Analyst and Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all active users',
    schema: {
      example: [
        {
          id: 1,
          email: 'user@example.com',
          name: 'John Doe',
          role: 'analyst',
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('me')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  async getProfile(@Req() request: AuthenticatedRequest) {
    return await this.usersService.findById(request.user.id);
  }

  @Get(':id')
  @Roles('analyst', 'admin')
  @ApiOperation({ summary: 'Get a user by ID (Analyst and Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user details (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User successfully soft deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.softDelete(id);
  }
}
