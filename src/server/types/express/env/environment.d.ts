declare namespace NodeJS {
  interface ProcessEnv {
    ENV: string;
    JWT_SECRET: string;
    REDIS_ADDRESS: string;
  }
}