const express = require('express'); 
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const connect = require('./db');
const productController = require('./src/controllers/productController');
const editproduct = require('./src/controllers/editproduct');
const productList = require('./src/controllers/productList');
const getCategory = require('./src/controllers/getCategory');
const category = require('./src/controllers/category');
const user = require('./src/controllers/user');
const login = require('./src/controllers/login');
const forgotpassword = require('./src/controllers/forgotpassword');
const resetpassword = require('./src/controllers/resetpassword');
const verifyauth = require('./src/controllers/verifyauth');
const logout = require('./src/controllers/logout');
const profile = require('./src/controllers/profile');
const addresspage = require ('./src/controllers/addresspage')
const updateUserDetails = require('./src/controllers/updateUserDetails')
const deleteUserDetails = require('./src/controllers/deleteUserDetails')
const adminorderlist = require('./src/controllers/adminorderlist')
const policy = require('./src/controllers/PolicyController')
const banner = require('./src/controllers/banner')
const orderpage = require("./src/controllers/orderpage");
const orders = require('./src/controllers/orders');
const faq = require('./src/controllers/faq')
const orderStatusUpdation = require('./src/controllers/orderStatusUpdation')
const returnRequest = require('./src/controllers/returnRequest')
const cookieParser = require('cookie-parser');
const path = require('path'); // Import path module
const helmet = require('helmet');


require('dotenv').config();
const app = express();
const server = http.createServer(app);


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                styleSrc: ["'self'", "https://fonts.googleapis.com"],
            },
        },
    })
);

  
app.get('/', (req, res) => {
    console.log('Cookies:', req.cookies);
    res.send('Backend server is running.');
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ["http://172.19.160.1", "http://localhost:5173","www.uandi.co"], credentials: true }));

app.use(cookieParser());

const io = require('socket.io')(server, {
  cors: {
      origin: ["http://172.19.160.1", "http://localhost:5173","www.uandi.co"],
      methods: ["GET", "POST", "PUT"],
      credentials: true
  }
});

// Socket.IO Connection
let userSockets = {}; 

io.on('connection', (socket) => {
  const cookies = cookie.parse(socket.request.headers.cookie || '');
  console.log('parsed Cookies',cookies)
  const token = cookies.token; // Assuming your JWT token is stored with the key 'token'

  // Check if the token exists
  if (!token) {
      // Emit an authentication failure event to the client
      socket.emit('auth_error', { status: false, message: "Authentication failed" });
      socket.disconnect(true); // Optionally disconnect the client
      return;
  }

  // Verify the token and extract user ID
  let userId;
  try {
      const decoded = jwt.verify(token, process.env.KEY);
      userId = decoded.id;
      userSockets[userId] = socket.id; 
  } catch (err) {
      socket.emit('auth_error', { status: false, message: "Invalid token" });
      socket.disconnect(true); // Disconnect if token is invalid
      return;
  }

  // Listen for order status updates
  socket.on('orderStatusUpdation', (data) => {
      console.log(userSockets);
      orderStatusUpdation(socket, data,userSockets,io);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
      console.log('Client disconnected');
      // Remove the socket ID from userSockets when the user disconnects
      if (userId) {
          delete userSockets[userId];
          console.log(userSockets);
      }
  });
});

// Database connection
connect();

// Routes
app.use('/addproducts', productController);
app.use('/editproducts', editproduct);
app.use('/productList', productList);
app.use('/category', getCategory);
app.use('/createcategory', category);
app.use('/auth', user);
app.use('/auth/login', login);
app.use('/auth/forgotpassword', forgotpassword);
app.use('/auth/resetpassword', resetpassword);
app.use('/auth/verify', verifyauth);
app.use('/auth/logout', logout);
app.use('/profile', profile);  
app.use('/getAddress', addresspage);  
app.use('/update/address', updateUserDetails);  
app.use('/delete/address', deleteUserDetails);  
app.use('/orderpage', orderpage);  
app.use('/placeOrder', orders);  
app.use('/banners', banner);  
app.use('/admin/orders', adminorderlist);  
app.use('/admin/policy', policy);  
app.use('/returnRequest', returnRequest);  
app.use('/upload-faqs', faq);  


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
