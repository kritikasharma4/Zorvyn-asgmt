import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/interfaces';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dtos/create-record.dto';
import { UpdateRecordDto } from './dtos/update-record.dto';
import { RecordFilterDto } from './dtos/record-filter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('records')
@Controller('records')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class RecordsController {
  constructor(private recordsService: RecordsService) {}

  @Post()
  @Roles('viewer', 'analyst', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new financial record' })
  @ApiResponse({
    status: 201,
    description: 'Record successfully created',
    schema: {
      example: {
        id: 1,
        user_id: 1,
        amount: 1000.5,
        type: 'income',
        category: 'Salary',
        currency: 'USD',
        date: '2024-01-01T00:00:00.000Z',
        notes: 'Monthly salary',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or currency mismatch',
  })
  async create(@Req() request: AuthenticatedRequest, @Body() createRecordDto: CreateRecordDto) {
    return await this.recordsService.create(request.user.id, createRecordDto);
  }

  @Get('my-records')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get current user records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of user records with pagination',
  })
  async getUserRecords(@Req() request: AuthenticatedRequest, @Query() filters: RecordFilterDto) {
    return await this.recordsService.findUserRecords(request.user.id, filters);
  }

  @Get('my-records/:id')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Get a specific user record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Record details',
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
  })
  async getUserRecord(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return await this.recordsService.findUserRecord(request.user.id, id);
  }

  @Get()
  @Roles('analyst', 'admin')
  @ApiOperation({ summary: 'Get all records (Analyst and Admin only) with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of all records with pagination',
  })
  async getAllRecords(@Query() filters: RecordFilterDto) {
    return await this.recordsService.findAllRecords(filters);
  }

  @Get(':id')
  @Roles('analyst', 'admin')
  @ApiOperation({ summary: 'Get a specific record by ID (Analyst and Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Record details',
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
  })
  async getRecord(@Param('id', ParseIntPipe) id: number) {
    const filters = new RecordFilterDto();
    const records = await this.recordsService.findAllRecords(filters);
    const record = records.data.find((r) => r.id === id);
    if (!record) {
      throw new Error('Record not found');
    }
    return record;
  }

  @Put('my-records/:id')
  @Roles('viewer', 'analyst', 'admin')
  @ApiOperation({ summary: 'Update user record (only amount and notes)' })
  @ApiResponse({
    status: 200,
    description: 'Record successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
  })
  async updateUserRecord(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() updateRecordDto: UpdateRecordDto) {
    return await this.recordsService.update(request.user.id, id, updateRecordDto);
  }

  @Delete('my-records/:id')
  @Roles('viewer', 'analyst', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete user record' })
  @ApiResponse({
    status: 200,
    description: 'Record successfully soft deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
  })
  async deleteUserRecord(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return await this.recordsService.softDelete(request.user.id, id);
  }
}
