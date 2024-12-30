require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      `Mongo DB connected  !! DB Host : ${connectionInstance.connection.host} `
    );
  } catch (error) {
    console.log("Mongo DB connection error : ", error);
    process.exit(1);
  }
};

module.exports = connectDB;
