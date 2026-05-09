const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const ticketRoutes = require("./src/routes/ticket");
const issueCategoryRoutes = require("./src/routes/issueCategory");
const subAdminRoutes = require("./src/routes/subAdmin");

dotenv.config();

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:3000",
  "https://ask-it-frontend.onrender.com",
  "https://ask-it-frontend.vercel.app",
  "https://help-desk-frontend-three.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
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

app.get("/", (req, res) => {
  res.send("Ticketing API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
