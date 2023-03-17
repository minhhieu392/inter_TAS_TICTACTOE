import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../utils/utils';
import APIError from '../../utils/APIError';
import httpStatus from 'http-status';

const jwtHandler = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded
  } catch (error) {
    return false;
  }
}

export const authorize = (token: any) => {
  const sss = jwt.sign('hello', JWT_SECRET);
  const decoded = jwtHandler(token);
  if (!decoded) {
    return false;
  }
  return true;
};

// const jwtHandler = (token: string, next: any) => {
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     return decoded
//   } catch (error) {
//     // return next(new Error("unauthorized"));
//     return next(new APIError(httpStatus.UNAUTHORIZED, 'unauthorized'))
//   }
// }

// export const authorizeSocketIO = async (socket: Socket, next: any) => {
//   const authKey = socket.handshake.auth;
//     if (authKey && authKey.token) {
//       const decoded = jwtHandler(authKey.token, next);
//       if (!decoded) {
//         next(new APIError(httpStatus.UNAUTHORIZED, 'unauthorized')) 
//       }
//       socket['user'] = decoded;
//       next();
//     } else {
//       next(new APIError(httpStatus.UNAUTHORIZED, 'unauthorized'));
//     }
// };