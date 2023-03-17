import * as redis from 'redis';
import { REDIS_ADDRESS } from '../utils/utils';
import logger from '../config/logger';

export default class RedisMatching {
  private static redisMatchingClient: any;

  static async initializer() {
    try {
      this.redisMatchingClient = redis.createClient({
        url: REDIS_ADDRESS,
        database: 1,
      });
      await this.redisMatchingClient.connect();
      logger.info(`redisMatchingClient - redisMatchingClient created ...`);
    } catch (error) {
      logger.error('redisMatchingClient - redisMatchingClient error...', error);
    }
  }

  static async hGet(key) {
    try {
      const data = await this.redisMatchingClient.hGetAll(key)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - hGet message error...', e);
      return null
    }
  }

  static async hGetByField(key, field) {
    try {
      const data = await this.redisMatchingClient.hGet(key, field)
      return Object.keys(data).length ? data : null;
    } catch (e) {
      logger.error('redisMatchingClient - hGetByField message error...', e);
      return null
    }
  }

  static async hSet(key, field, value) {
    try {
      const data = await this.redisMatchingClient.hSet(key, field, value)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - hSet message error...', e);
      return null
    }
  }

  static async rPush(key, field) {
    try {
      const data = await this.redisMatchingClient.rPush(key, field)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - rPush message error...', e);
      return null
    }
  }

  static async lRange(key, start = 0, stop = -1) {
    try {
      const data = await this.redisMatchingClient.lRange(key, start, stop)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - lRange message error...', e);
      return null
    }
  }

  static async lRem(key, count = 0, element) {
    try {
      const data = await this.redisMatchingClient.lRem(key, count, element)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - lRem message error...', e);
      return null
    }
  }

  static async hSetObject(key, object) {
    try {
      const data = await this.redisMatchingClient.hSet(key, object)
      return data
    } catch (e) {
      logger.error('redisMatchingClient - hSetObject message error...', e);
      return null
    }
  }

  static async get(key) {
    try {
      const data = await this.redisMatchingClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (e) {
      logger.error('redisMatchingClient - get message error...', e);
      return []
    }
  }

  static async set(key, val) {
    try {
      logger.info(`redisMatchingClient - set ${key} ${val}`);
      await this.redisMatchingClient.set(key, JSON.stringify(val))
    } catch (e) {
      logger.error('redisMatchingClient - set message error...', e);
    }
  }

  static async scan(pattern = "*", count = 10) {
    try {
      const results = [];
      const iteratorParams = {
        MATCH: pattern,
        COUNT: count
      }
      for await (const key of this.redisMatchingClient.scanIterator(iteratorParams)) {
        results.push(key);
      }
      return results;
    } catch (e) {
      logger.error('redisMatchingClient - scanIterator message error...', e);
      return []
    }
  }

  static async exists(key) {
    try {
      const res = await this.redisMatchingClient.exists(key);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - set message error...', e);
      return null;
    }
  }

  static async setNX(key, val = '0') {
    try {
      const res = await this.redisMatchingClient.setNX(key, val);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - setNX message error...', e);
      return null;
    }
  }

  static async setEX(key, second = 60, val) {
    try {
      const res = await this.redisMatchingClient.setEx(key, second, val);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - setNX message error...', e);
      return null;
    }
  }

  static async increment(key, val = 1) {
    try {
      const res = await this.redisMatchingClient.incrBy(key, val);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - increment message error...', e);
      return null;
    }
  }

  static async hDel(key, field) {
    try {
      const res = await this.redisMatchingClient.hDel(key, field);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - hDel message error...', e);
      return null;
    }
  }

  static async del(key) {
    try {
      const res = await this.redisMatchingClient.del(key);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - del message error...', e);
      return null;
    }
  }

  static async hKeys(key) {
    try {
      const res = await this.redisMatchingClient.hKeys(key);
      return res
    } catch (e) {
      logger.error('redisMatchingClient - del message error...', e);
      return null;
    }
  }

}