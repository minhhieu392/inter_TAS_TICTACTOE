import * as redis from 'redis';
import { REDIS_ADDRESS } from '../utils/utils';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';
import { BONUS_GAME_DATA_REDIS_TYPE } from '../utils/constants';
export default class RedisClient {
  private static publisher: any
  public static subscriber: any
  private static redisClient: any;

  static async initializer() {
    try {
      this.publisher = redis.createClient({
        url: REDIS_ADDRESS,
      });
      this.publisher.duplicate();
      await this.publisher.connect();
      logger.info(`Redis - Publisher created ...`);
    } catch (error) {
      logger.error('Redis - Publisher error...', error);
    }
    try {
      this.subscriber = redis.createClient({
        url: REDIS_ADDRESS,
      });
      this.subscriber.duplicate();
      await this.subscriber.connect();
      this.subscriber.subscribe('bonus-game-setting', async (data, error) => {
        if (error) console.log("error::::", error);
        const filePath = path.join(__dirname, '../resource/config/bonusgame.json');
        const dataParse = JSON.parse(JSON.parse(data));
        const { bonusGameReq } = dataParse
        if (bonusGameReq && bonusGameReq.type === BONUS_GAME_DATA_REDIS_TYPE.ALL) {
          await fs.writeFileSync(filePath, JSON.stringify(dataParse, null, 4));
        }
      })
      logger.info(`Redis - Subscriber created ...`);
    } catch (error) {
      logger.error('Redis - Subscriber error...', error);
    }
    try {
      this.redisClient = redis.createClient({
        url: REDIS_ADDRESS,
      });
      await this.redisClient.connect();
      logger.info(`Redis - Client created ...`);
    } catch (error) {
      logger.error('Redis - Client error...', error);
    }
  }

  static async publish<T>(channel: string, message: T) {
    try {
      logger.info(`Channel: ${channel} message: ${JSON.stringify(message)}`);
      await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Redis - Publish message error...', error);
    }
  }

  static async hGet(key) {
    try {
      const data = await this.redisClient.hGetAll(key)
      return data
    } catch (e) {
      logger.error('Redis - hGet message error...', e);
      return null
    }
  }

  static async hGetByField(key, field) {
    try {
      const data = await this.redisClient.hGet(key, field)
      return Object.keys(data).length ? data : null;
    } catch (e) {
      logger.error('Redis - hGetByField message error...', e);
      return null
    }
  }

  static async hSet(key, field, value) {
    try {
      const data = await this.redisClient.hSet(key, field, value)
      return data
    } catch (e) {
      logger.error('Redis - hSet message error...', e);
      return null
    }
  }

  static async rPush(key, field) {
    try {
      const data = await this.redisClient.rPush(key, field)
      return data
    } catch (e) {
      logger.error('Redis - rPush message error...', e);
      return null
    }
  }

  static async lRange(key, start = 0, stop = -1) {
    try {
      const data = await this.redisClient.lRange(key, start, stop)
      return data
    } catch (e) {
      logger.error('Redis - lRange message error...', e);
      return null
    }
  }

  static async lRem(key, count = 0, element) {
    try {
      const data = await this.redisClient.lRem(key, count, element)
      return data
    } catch (e) {
      logger.error('Redis - lRem message error...', e);
      return null
    }
  }

  static async hSetObject(key, object) {
    try {
      const data = await this.redisClient.hSet(key, object)
      return data
    } catch (e) {
      logger.error('Redis - hSetObject message error...', e);
      return null
    }
  }

  static async get(key) {
    try {
      const data = await this.redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (e) {
      logger.error('Redis - get message error...', e);
      return []
    }
  }

  static async set(key, val) {
    try {
      logger.info(`Redis - set ${key} ${val}`);
      await this.redisClient.set(key, JSON.stringify(val))
    } catch (e) {
      logger.error('Redis - set message error...', e);
    }
  }

  static async scan(pattern = "*", count = 10) {
    try {
      const results = [];
      const iteratorParams = {
        MATCH: pattern,
        COUNT: count
      }
      for await (const key of this.redisClient.scanIterator(iteratorParams)) {
        results.push(key);
      }
      return results;
    } catch (e) {
      logger.error('Redis - scanIterator message error...', e);
      return []
    }
  }

  static async exists(key) {
    try {
      const res = await this.redisClient.exists(key);
      return res
    } catch (e) {
      logger.error('Redis - set message error...', e);
      return null;
    }
  }

  static async setNX(key, val = '0') {
    try {
      const res = await this.redisClient.setNX(key, val);
      return res
    } catch (e) {
      logger.error('Redis - setNX message error...', e);
      return null;
    }
  }

  static async setEX(key, second = 60, val) {
    try {
      const res = await this.redisClient.setEx(key, second, val);
      return res
    } catch (e) {
      logger.error('Redis - setNX message error...', e);
      return null;
    }
  }

  static async increment(key, val = 1) {
    try {
      const res = await this.redisClient.incrBy(key, val);
      return res
    } catch (e) {
      logger.error('Redis - increment message error...', e);
      return null;
    }
  }

  static async hDel(key, field) {
    try {
      const res = await this.redisClient.hDel(key, field);
      return res
    } catch (e) {
      logger.error('Redis - hDel message error...', e);
      return null;
    }
  }

  static async del(key) {
    try {
      const res = await this.redisClient.del(key);
      return res
    } catch (e) {
      logger.error('Redis - del message error...', e);
      return null;
    }
  }

  static async hKeys(key) {
    try {
      const res = await this.redisClient.hKeys(key);
      return res
    } catch (e) {
      logger.error('Redis - del message error...', e);
      return null;
    }
  }

}