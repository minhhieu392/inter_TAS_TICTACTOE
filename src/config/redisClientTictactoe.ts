import Redis from "ioredis";
import { optional } from "joi";
let redisClient: Redis;

export const initializer = (): void => {
    console.log("Redis client initialized");
    redisClient = new Redis({
        host: "redis-15338.c1.ap-southeast-1-1.ec2.cloud.redislabs.com",
        port: 15338,
        username: "default",
        password: "FRo66LkuJG65rWnbZw61EqLcrELuxfAv",
    });
};
export const getValue = async (key: string): Promise<string | null> => {
    return await redisClient.get(key);
};

export const deleteKey = async (key: string): Promise<void> => {
    await redisClient.del(key);
};

export const updateValue = async (
    key: string,
    newValue: string
): Promise<void> => {
    await redisClient.set(key, newValue);
};

export const searchKeys = async (pattern: string): Promise<string[]> => {
    return await redisClient.keys(pattern);
};

// Thêm một trường vào hash
export const hset = async (
    key: string,
    field: string,
    value: string
): Promise<void> => {
    await redisClient.hset(key, field, value);
};

// Lấy giá trị của một trường trong hash
export const hget = async (
    key: string,
    field: string
): Promise<string | null> => {
    return await redisClient.hget(key, field);
};

// Xóa một trường trong hash
export const hdel = async (key: string, field: string): Promise<void> => {
    await redisClient.hdel(key, field);
};
export const del = async (key: string) => {
    await redisClient.del(key)
}

// Lấy tất cả các trường và giá trị trong hash
export const hgetall = async (
    key: string
): Promise<{ [key: string]: string }> => {
    return await redisClient.hgetall(key);
};
export const deleteHash = async (key: string): Promise<void> => {
    const fields = await redisClient.hkeys(key);

    fields.forEach((field) => {
        redisClient.hdel(key, field);
    });

    await redisClient.del(key);
};

// Kiểm tra xem một trường có tồn tại trong hash hay không
export const hexists = async (
    key: string,
    field: string
): Promise<boolean> => {
    const result = await redisClient.hexists(key, field);
    return result === 1;
};
export const scan = async (cursor: string, patternToken: "MATCH", pattern: string) => {
    return await redisClient.scan(cursor, patternToken, pattern)
}

export const zrangebyscore = async (key: string | Buffer, min: number | string, max: number | string, callback) => {
    await redisClient.zrangebyscore(key, min, max, callback);

    // if (callback.err) {
    //     console.error(callback.err)
    //     return
    // }
    // if (callback.result.length === 0) {
    //     console.log('No records to delete')
    //     return
    // }
    await redisClient.zremrangebyscore(key, min, max, callback);
};

export const zremrangebyscore = async (key: string | Buffer, min: number | string, max: number | string, callback) => {
    return await redisClient.zremrangebyscore(key, min, max, callback);
};
export const keys = async (pattern: string): Promise<string[]> => {

    return await redisClient.keys(pattern);
};
export const getKeyType = async (key: string) => {

    return await redisClient.type(key);
};


