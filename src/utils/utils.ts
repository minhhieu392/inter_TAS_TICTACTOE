
export const ENV = process.env.NODE_ENV || 'local';
export const IS_DEVELOPMENT = ENV === 'development';
export const IS_PRODUCTION = ENV === 'production';
export const PORT = process.env.PORT || 8080;
export const CODE_BUILD = '2022.12.01.11.00';
export const JWT_SECRET = process.env.JWT_SECRET;
export const REDIS_ADDRESS = process.env.REDIS_ADDRESS || 'redis://';
export const POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://';
export const BASE_URL = process.env.BASE_URL || '';

export const random = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  
export const diffTime = (date1: Date, date2: Date) => {
    const diffInTime = new Date(date2).getTime() - new Date(date1).getTime();
    return Math.round(Math.abs(diffInTime));
};
