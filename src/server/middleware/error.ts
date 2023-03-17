/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Request , Response, NextFunction } from 'express';
import expressValidation from 'express-validation';
import ApiError from '../../utils/APIError';
import httpStatus from 'http-status'
import { IS_PRODUCTION } from '../../utils/utils';
import logger from '../../config/logger';

export const errorHandler = (err: any, req: any, res: any) => {
  let { statusCode, message } = err
  if (IS_PRODUCTION && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR]
  }
  const response = {
    code: statusCode,
    message,
    ...(!IS_PRODUCTION && { stack: err.stack }),
  }

  if (!IS_PRODUCTION) {
    logger.error(err)
  }

  res.status(statusCode).json(response)
}

export const errorConverter = (err: any, req: any, res: any, next: any) => {
  let error = err 

  if (err instanceof expressValidation.ValidationError) {
    error = new ApiError(
      err.statusCode,
      (err.details.params || err.details.query || err.details.body || []).map(e => e.message).join(',')
    );
  } else if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || httpStatus.BAD_REQUEST
    const message = error.message || httpStatus[statusCode]
    error = new ApiError(statusCode, message as string, true, err.stack)
  }
  errorHandler(error, req, res);
}

/**
 * Catch 404 and forward to error handler
 * @public
 */
 export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
   const error = new ApiError(httpStatus.NOT_FOUND, 'Not found');
  errorHandler(error, req, res);
};