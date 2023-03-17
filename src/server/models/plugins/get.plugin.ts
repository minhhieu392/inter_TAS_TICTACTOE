import httpStatus from 'http-status';
import APIError from '../../../utils/APIError';

export default async function <T>(this: any, id: string): Promise<T> {
  const document: T = await this.findOne({ _id: id }).lean();
  if (!document) {
    throw new APIError(
      httpStatus.NOT_FOUND,
      `${this.modelName} does not exist`,
    );
  }
  return document;
}