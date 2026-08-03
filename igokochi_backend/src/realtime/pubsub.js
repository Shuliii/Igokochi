import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const CHANNEL = "orders";

const localHandlers = [];
let publisher = null;

if (REDIS_HOST) {
  const redisConfig = {host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD};
  publisher = new Redis(redisConfig);
  const subscriber = new Redis(redisConfig);

  subscriber.subscribe(CHANNEL, (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err.message);
      return;
    }
    console.log(`Subscribed to '${CHANNEL}' — listening on ${count} channel(s).`);
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== CHANNEL) return;

    try {
      const event = JSON.parse(message);
      for (const handler of localHandlers) handler(event);
    } catch (err) {
      console.error("Failed to parse Redis pub/sub message:", err.message);
    }
  });
} else {
  console.log("REDIS_HOST not set — running in single-instance mode (no cross-pod broadcast).");
}

// Called by wsServer.js to get notified whenever an order event arrives,
// whether it came from Redis (multi-pod) or was published locally (no Redis configured).
export function onOrderEvent(handler) {
  localHandlers.push(handler);
}

export async function publishOrderEvent(event) {
  if (!publisher) {
    // No Redis configured — just notify this process's own handlers directly.
    for (const handler of localHandlers) handler(event);
    return;
  }

  try {
    await publisher.publish(CHANNEL, JSON.stringify(event));
  } catch (err) {
    // A Redis hiccup shouldn't fail order creation — the order is already
    // safely in the DB; the admin polling fallback will catch it regardless.
    console.error("Failed to publish order event to Redis:", err.message);
  }
}
