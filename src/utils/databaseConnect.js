import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Uniconnect MongoDB Database is Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ Error in Uniconnect MongoDB database: ${error.message}`);
    process.exit(1);
  }
};