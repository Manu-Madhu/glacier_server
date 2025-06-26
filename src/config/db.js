import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connecting to DB...");
  } catch (error) {
    console.log("Failed to connect to db", error);
    throw error;
  }
};

export { connectDB };
