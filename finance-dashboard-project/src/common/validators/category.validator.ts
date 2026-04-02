import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@ValidatorConstraint({ name: 'isCategoryExists', async: true })
@Injectable()
export class IsCategoryExistsConstraint implements ValidatorConstraintInterface {
  async validate(value: string) {
    const category = await getRepository(Category).findOne({
      where: { name: value.toLowerCase() },
    });
    return !!category;
  }

  defaultMessage() {
    return 'Category $value does not exist';
  }
}

export function IsValidCategory(validationOptions?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCategoryExistsConstraint,
    });
  };
}
