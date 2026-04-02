import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

export class AccessDeniedException extends ForbiddenException {
  constructor(message: string = 'Access denied') {
    super(message);
  }
}

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, identifier?: string) {
    super(`${resource} not found${identifier ? ` (${identifier})` : ''}`);
  }
}

export class ValidationException extends BadRequestException {
  constructor(message: string, errors?: any) {
    super({ message, errors });
  }
}

export class DuplicateEmailException extends ConflictException {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

export class UserLimitExceededException extends BadRequestException {
  constructor(maxUsers: number) {
    super(`Maximum users limit (${maxUsers}) has been reached`);
  }
}

export class CurrencyMismatchException extends BadRequestException {
  constructor(recordCurrency: string, systemCurrency: string) {
    super(`Record currency ${recordCurrency} does not match system currency ${systemCurrency}`);
  }
}

export class ImmutableFieldException extends BadRequestException {
  constructor(fieldName: string) {
    super(`Field ${fieldName} cannot be modified after creation`);
  }
}
