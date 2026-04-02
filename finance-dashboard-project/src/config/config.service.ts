import { Injectable } from '@nestjs/common';
import { ConfigRepository } from './config.repository';
import { SetMaxUsersDto } from './dtos/set-max-users.dto';
import { SetCurrencyDto } from './dtos/set-currency.dto';

@Injectable()
export class ConfigService {
  constructor(private configRepository: ConfigRepository) {}

  async getMaxUsers(): Promise<{ max_users: number }> {
    const maxUsers = await this.configRepository.getMaxUsers();
    return { max_users: maxUsers };
  }

  async setMaxUsers(setMaxUsersDto: SetMaxUsersDto): Promise<{ max_users: number }> {
    await this.configRepository.setMaxUsers(setMaxUsersDto.max_users);
    return { max_users: setMaxUsersDto.max_users };
  }

  async getCurrency(): Promise<{ currency: string }> {
    const currency = await this.configRepository.getCurrency();
    return { currency };
  }

  async setCurrency(setCurrencyDto: SetCurrencyDto): Promise<{ currency: string }> {
    await this.configRepository.setCurrency(setCurrencyDto.currency);
    return { currency: setCurrencyDto.currency };
  }
}
