import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { apiRouter } from "../routes/index.js";
import { startPaymentCron } from "../service/paymentCron.js";

import dotenv from "dotenv";
dotenv.config();

export function normalizeIP(ip) {
  // Check if it starts with the IPv6-mapped IPv4 prefix
  // if (ip.startsWith("::ffff:")) {
  //   return ip.slice(7); // remove the "::ffff:" part
  // }
  return ip;
}

export const geoIP = async (ip) => {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) {
      console.error(
        `Failed to fetch geolocation for IP ${ip}: ${res.statusText}`
      );
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error(
        `Error in geolocation response for IP ${ip}: ${data.reason}`
      );
      return null;
    }

    console.log(`Geolocation data for IP ${ip}:`, data);

    return data;
  } catch (error) {
    console.error("Error fetching geoIP data:", error);
    return null;
  }
};

const app = express();
const bodySizeLimit = process.env.BODY_SIZE_LIMIT || "10mb";

// Trust proxy - required for Render and other hosting platforms
app.set("trust proxy", true);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
// Paystack signature verification requires the exact raw request body.
app.use(
  "/api/webhook/paystack",
  express.raw({ type: "application/json", limit: bodySizeLimit })
);
app.use(express.json({ limit: bodySizeLimit }));
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));

// Routes
app.use("/api", apiRouter);

startPaymentCron();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Return a consistent JSON response when request body exceeds configured limit
app.use((err, req, res, next) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      ok: false,
      message: `Request payload too large. Max allowed is ${bodySizeLimit}.`,
    });
  }

  return next(err);
});

export { app };
