const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const alertRoutes = require('./routes/alerts');
const meetingRoutes = require('./routes/meetings');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
  res.send('Cybersecurity Incident Detection API is running');
});

app.listen(PORT, () => {
  console.log(`Security Server running on port ${PORT}`);
});
