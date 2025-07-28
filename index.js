// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for demonstration
let weightData = [];

// API endpoint to receive weight data
app.post('/api/weight', (req, res) => {
  try {
    const { weight } = req.body;
    const timestamp = new Date().toISOString();
    
    if (typeof weight !== 'number') {
      return res.status(400).json({ error: 'Invalid weight data' });
    }

    // Store the data (in a real app, you'd save to a database)
    weightData.push({ weight, timestamp });
    
    // Keep only the last 100 entries to prevent memory issues
    if (weightData.length > 100) {
      weightData = weightData.slice(-100);
    }

    console.log(`Received weight: ${weight} kg at ${timestamp}`);
    res.status(200).json({ message: 'Weight data received', weight, timestamp });
  } catch (error) {
    console.error('Error processing weight data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get all weight data
app.get('/api/weight', (req, res) => {
  res.status(200).json(weightData);
});

// Basic health check
app.get('/', (req, res) => {
  res.send('Weight Tracking Server is running made by safal');
});

app.get('/sayhi', (req, res) => {
  res.send('Hi safal');
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});