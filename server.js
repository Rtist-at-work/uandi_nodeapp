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

const corsOptions = {
  origin: "https://uandik.netlify.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 👈 important

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
