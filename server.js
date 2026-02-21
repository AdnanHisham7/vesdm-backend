const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// HTTP request logger
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// CORS configuration to allow credentials
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/student', require('./routes/studentPortal'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/applications', require('./routes/applicationsRoutes'));
app.use('/api/inquiries', require('./routes/inquiriesRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'))
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/franchise', require('./routes/franchiseRoutes'));

connectDB(); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));