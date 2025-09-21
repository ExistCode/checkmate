import Redis, { Cluster } from "ioredis";

const mode = process.env.REDIS_MODE || "single"; // "single" | "cluster"
const useTLS = String(process.env.REDIS_TLS || "true") === "true";
const keyPrefix = process.env.REDIS_KEY_PREFIX || "";

function createSingle() {
  return new Redis({
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: useTLS ? {} : undefined,
    keyPrefix,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
  });
}

function createCluster() {
  const host = process.env.REDIS_HOST!;
  const port = Number(process.env.REDIS_PORT || 6379);
  return new Cluster([{ host, port }], {
    redisOptions: {
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: useTLS ? {} : undefined,
      keyPrefix,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
    },
    scaleReads: "all",
    slotsRefreshTimeout: 2000,
  });
}

export const redis = mode === "cluster" ? createCluster() : createSingle();

export async function ensureRedis() {
  if (redis.status === "ready") return;
  if (redis.status === "connecting") return;
  await redis.connect?.();
}
