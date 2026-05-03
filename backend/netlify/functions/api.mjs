import serverless from "serverless-http";
import dotenv from "dotenv";
import app from "../../src/app.js";
import { connectDB } from "../../src/config/db.js";

dotenv.config();

let dbConnectPromise;

const ensureDbConnection = async () => {
  if (!dbConnectPromise) {
    dbConnectPromise = connectDB();
  }
  await dbConnectPromise;
};

const expressHandler = serverless(app);

export const handler = async (event, context) => {
  await ensureDbConnection();
  return expressHandler(event, context);
};
