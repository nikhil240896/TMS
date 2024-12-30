require("dotenv").config();
const connectDB = require("./src/db/db_connect");
const app = require("./src/app");
const redis = require("redis");
const { PORT, REDIS_HOST, REDIS_PORT } = process.env;

// Create a Redis client
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Ensure Redis is connected
redisClient.connect();

connectDB()
  .then(() => {
    app.locals.redis = redisClient; // Attach Redis client to `app.locals`
    app.on("error", (error) => {
      console.log("Errr : ", error); // express app is listening to error event
      throw error;
    });
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo DB connection failed !!!!", err);
  });
