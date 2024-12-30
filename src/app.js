const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const globallErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoute");

const app = express();

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/api/ping", async (_, res) => {
  function atob(encodedString) {
    const abc = Buffer.from(encodedString, "base64").toString("binary");
    console.log("abc", abc);
    res.send({ data: abc });
  }
  atob("Nikhil Kumar");
});

app.use("/api/users", userRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(globallErrorHandler); //global error handler middleware
module.exports = app;
