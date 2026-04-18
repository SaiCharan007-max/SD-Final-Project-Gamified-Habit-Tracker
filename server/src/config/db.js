import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";
const hasConnectionString = Boolean(process.env.DATABASE_URL);

const poolConfig = hasConnectionString
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: isProduction ? { rejectUnauthorized: false } : false
      }
    : {
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME
      };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    console.log(`DB connected (${hasConnectionString ? "cloud/url" : "local"})`);
});

export default pool;
