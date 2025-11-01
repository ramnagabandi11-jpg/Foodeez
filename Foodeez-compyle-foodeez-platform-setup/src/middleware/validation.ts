import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '@/utils/errors';

/**
 * Middleware to check validation results from express-validator
 */
export const validate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error) => ({
      field: 'path' in error ? error.path : 'unknown',
      message: error.msg,
    }));

    return next(
      new ValidationError('Validation failed', errorDetails)
    );
  }

  next();
};

/**
 * Helper to run validation chains and check results
 */
export const runValidation = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map((error) => ({
        field: 'path' in error ? error.path : 'unknown',
        message: error.msg,
      }));

      return next(
        new ValidationError('Validation failed', errorDetails)
      );
    }

    next();
  };
};

export default { validate, runValidation };
