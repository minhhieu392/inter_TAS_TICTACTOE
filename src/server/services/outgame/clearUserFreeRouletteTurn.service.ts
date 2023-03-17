import cron from 'node-cron';
import RedisClient from '../../../config/redis';
import logger from '../../../config/logger';

export const clearUserFreeRouletteTurn = () => {
  logger.info(`[CLEAR USER FREE ROULETTE TURN] Cron job start!!!`);
  try {
    cron.schedule('0 0 * * *', async () => {
      await RedisClient.del('userPlayFreeRoulette')
      logger.info(`[CLEAR USER FREE ROULETTE TURN SUCCESS]`);
    });
  } catch (e) {
    logger.info(`[CLEAR USER FREE ROULETTE TURN FAILED]`, e);
  }
}

