import cron from 'node-cron';
import RedisClient from '../../../config/redis';
import logger from '../../../config/logger';
import {
    hset,
    hget,
    deleteHash,
    hdel,
    getKeyType,
    del,
    hgetall,
    hexists,
    searchKeys,
    scan,
    zrangebyscore,
    zremrangebyscore,
    keys
} from "../../../config/redisClientTictactoe";

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

/**
 * It deletes all keys that are hashes and have a field named "createdAt" whose value is older than 7
 * days
 */
export const delUserInAsyncQueue = () => {
    try {
        cron.schedule('0 0 * * *', async () => {
            keys('*')
                .then((allKeys: string[]) => {
                    allKeys.forEach((key) => {
                        // Kiểm tra xem key có phải là hash hay không
                        getKeyType(key)
                            .then((type: string) => {
                                if (type === 'hash') {
                                    // Lấy value của key có name = "createdAt"
                                    hget(key, 'createdAt')
                                        .then((value: string | null) => {
                                            if (value) {
                                                // Kiểm tra xem value có lâu hơn 7 ngày tính từ thời điểm hiện tại hay không
                                                const createdAt: Date = new Date(value);
                                                const now: Date = new Date();
                                                const diffInDays: number = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                                                if (diffInDays > 7) {
                                                    // Nếu value lâu hơn 7 ngày tính từ thời điểm hiện tại, xóa key
                                                    del(key)
                                                        .then(() => {
                                                            console.log('Deleted key:', key);
                                                        })
                                                        .catch((err: Error) => {
                                                            console.error('Failed to delete key:', key, err);
                                                        });
                                                }
                                            }
                                        })
                                        .catch((err: Error) => {
                                            console.error('Failed to get value from key:', key, err);
                                        });
                                }
                            })
                            .catch((err: Error) => {
                                console.error('Failed to get type of key:', key, err);
                            });
                    });
                })
                .catch((err: Error) => {
                    console.error('Failed to get all keys:', err);
                });

            logger.info(`[DELETE USERS IN THE ASYNC QUEUE]`);
        });
    } catch (e) {
        logger.info(`[DELETE USERS IN THE ASYNC QUEUE FAILED]`, e);
    }
}

