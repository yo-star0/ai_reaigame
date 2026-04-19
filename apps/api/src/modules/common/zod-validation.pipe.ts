import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';

export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          issues: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      throw err;
    }
  }
}
