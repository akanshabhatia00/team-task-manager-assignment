import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

const shouldUseMemoryDb = () =>
  process.env.USE_IN_MEMORY_DB === "true" ||
  (!process.env.MONGODB_URI && process.env.NODE_ENV !== "production");

export const connectDB = async () => {
  const { MONGODB_URI } = process.env;
  if (shouldUseMemoryDb()) {
    process.env.HOME = process.env.HOME || "/tmp";
    process.env.MONGOMS_DOWNLOAD_DIR =
      process.env.MONGOMS_DOWNLOAD_DIR || "/tmp/mongodb-binaries";
    process.env.MONGOMS_PREFER_GLOBAL_PATH = "true";
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri("team_task_manager");
    await mongoose.connect(uri);
    console.log("Connected to in-memory MongoDB");
    return;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }
  await mongoose.connect(MONGODB_URI);
};
