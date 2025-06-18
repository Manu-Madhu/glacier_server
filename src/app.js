import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "./utils/logger.util.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { authRouter } from "./routes/auth.router.js";

const app = express();

const { NODE_ENV } = process.env;

app.use(cookieParser());

const corsOptions = {
  credentials: true,
  origin: function(origin, callback) {
    if (!origin || NODE_ENV == "development") {
      callback(null, true);
    } else {
      const allowedOrigin = [];
      if (allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    }
  }
};

app.use(cors(corsOptions));
// help to use the row in server in req.body
app.use(express.json());
// help to read the form data  from the frontend
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

//api call
app.get("/", (req, res) => {
  return res.send(
    `<html>
      <head><title>Glacier</title></head>
      <body>
        <h1>Glacier API</h1>
      </body>
    </html>`
  );
});

app.use("/api/auth", authRouter)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
    error:"NOT_FOUND"
  });
});

app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err}`);
  process.exit(1);
});


export default app;