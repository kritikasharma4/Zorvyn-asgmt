import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { SystemConfig } from '../../database/entities/system-config.entity';

const VALID_CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK'];

@ValidatorConstraint({ name: 'isValidCurrency', async: true })
@Injectable()
export class IsValidCurrencyConstraint implements ValidatorConstraintInterface {
  async validate(value: string) {
    if (!VALID_CURRENCIES.includes(value.toUpperCase())) {
      return false;
    }

    // Check if it matches system currency
    const systemConfig = await getRepository(SystemConfig).findOne({
      where: { key: 'system_currency' },
    });

    if (!systemConfig) {
      // If not configured, accept USD as default
      return value.toUpperCase() === 'USD';
    }

    return value.toUpperCase() === systemConfig.value;
  }

  defaultMessage() {
    return 'Currency $value is not valid or does not match system currency';
  }
}

export function IsValidCurrency(validationOptions?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCurrencyConstraint,
    });
  };
}
