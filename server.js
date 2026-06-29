const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const ticketRoutes = require("./src/routes/ticket");
const issueCategoryRoutes = require("./src/routes/issueCategory");
const subAdminRoutes = require("./src/routes/subAdmin");
const userRoutes = require("./src/routes/user");

dotenv.config();

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://ask-it-frontend.vercel.app",
  "https://help-desk-frontend-three.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const localDevPorts = new Set(["3000", "8080", "8081"]);

const isPrivateIPv4 = (hostname) => {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { protocol, hostname, port } = new URL(origin);
    return (
      protocol === "http:" &&
      localDevPorts.has(port) &&
      isPrivateIPv4(hostname)
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);
app.use("/categories", issueCategoryRoutes);
app.use("/sub-admins", subAdminRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Ticketing API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
