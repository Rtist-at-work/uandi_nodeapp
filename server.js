const express = require("express");
const cors = require('cors');
const apiRoutes = require('./routes/api.routes');
const connect = require('./db');
const cookieParser = require("cookie-parser");
require('dotenv').config();
 

const app = express();
const PORT = process.env.PORT;

// Middleware to parse JSON
app.use(express.json());
// cookie parser
app.use(cookieParser());

// origin cors
const allowedOrigins = [
  "https://uandik.netlify.app",
  "https://www.uandik.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, Razorpay)
    if (!origin) return callback(null, true);

    // allow Netlify domains (including previews)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".netlify.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));






// routes
app.use('/api', apiRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// connect and start
connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
