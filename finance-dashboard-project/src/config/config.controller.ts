import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { SetMaxUsersDto } from './dtos/set-max-users.dto';
import { SetCurrencyDto } from './dtos/set-currency.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('config')
@Controller('config')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('max-users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get maximum number of users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Maximum users retrieved',
    schema: { example: { max_users: 100 } },
  })
  async getMaxUsers() {
    return await this.configService.getMaxUsers();
  }

  @Post('max-users')
  @Roles('admin')
  @ApiOperation({ summary: 'Set maximum number of users (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Maximum users updated',
    schema: { example: { max_users: 150 } },
  })
  async setMaxUsers(@Body() setMaxUsersDto: SetMaxUsersDto) {
    return await this.configService.setMaxUsers(setMaxUsersDto);
  }

  @Get('currency')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system currency (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System currency retrieved',
    schema: { example: { currency: 'USD' } },
  })
  async getCurrency() {
    return await this.configService.getCurrency();
  }

  @Post('currency')
  @Roles('admin')
  @ApiOperation({ summary: 'Set system currency (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System currency updated',
    schema: { example: { currency: 'EUR' } },
  })
  async setCurrency(@Body() setCurrencyDto: SetCurrencyDto) {
    return await this.configService.setCurrency(setCurrencyDto);
  }
}
