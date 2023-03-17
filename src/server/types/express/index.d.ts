declare namespace Express {
    interface Request {
      locals?: any;
      user?: {
        userName: string;
        userId: number;
      };
    }
  }