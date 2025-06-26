import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "./utils/logger.util.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { authRouter } from "./routes/auth.route.js";
import { uploadRouter } from "./routes/upload.route.js";
import { userRouter } from "./routes/user.route.js";
import { productRouter } from "./routes/product.route.js";
import { categoryRouter } from "./routes/category.route.js";
import { orderRouter } from "./routes/order.route.js";
import { discountRouter } from "./routes/discount.route.js";
import { bannerRouter } from "./routes/banner.route.js";
import { enquiryRouter } from "./routes/enquiry.route.js";
import { reviewRouter } from "./routes/review.route.js";
import { testimonialRouter } from "./routes/testimonial.route.js";
import { dashboardRouter } from "./routes/dashboard.route.js";
import { logisticsRouter } from "./routes/logistics.route.js";
import { settingsRouter } from "./routes/settings.route.js";

const app = express();

const {
  user_dev_url,
  admin_dev_url,
  user_prod_url,
  admin_prod_url,
  NODE_ENV,
} = process.env;

app.use(cookieParser());

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin || NODE_ENV === "development") {
      callback(null, true);
    } else {
      const allowedOrigins = [
        user_dev_url,
        admin_dev_url,
        user_prod_url,
        admin_prod_url,
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  return res.send(`
    <html>
      <head><title>Glacer </title></head>
      <body>
        <h1>The Glacer API</h1>
      </body>
    </html>
  `);
});

app.use("/api/auth", authRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/discounts", discountRouter);
app.use("/api/enquiries", enquiryRouter);
app.use("/api/logistics", logisticsRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/users", userRouter);

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
    error: "NOT_FOUND",
  })
);

app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err}`);
  process.exit(1);
});

export default app;
