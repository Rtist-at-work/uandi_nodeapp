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
// const allowedOrigins = [
//   "http://localhost:5174",
//   // "http://localhost:5175",
//   "http://localhost:5173",
//   "http://localhost:4000",
//   "http://172.19.160.1",
//   "https://www.uandi.co",
//   "https://127.0.0.1:5000"
// ];

app.use(cors({
  origin: "*",
  // function (origin, callback) {
  //   if (!origin || allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Not allowed by CORS"));
  //   }
  // },
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
