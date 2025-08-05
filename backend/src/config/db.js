const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`Error: ${error.message}`);
    }
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
