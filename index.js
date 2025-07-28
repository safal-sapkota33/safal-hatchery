const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url} from ${req.ip}`);
  next();
});

// Other middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for demonstration
let weightData = [];
let hatcheryData = [];

// API endpoint to receive weight data
app.post('/api/weight', (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/weight - Received body:`, req.body);
    const { weight } = req.body;
    const timestamp = new Date().toISOString();
    
    if (typeof weight !== 'number') {
      console.log(`[${new Date().toISOString()}] POST /api/weight - Invalid weight data:`, weight);
      return res.status(400).json({ error: 'Invalid weight data' });
    }

    // Store the data (in a real app, you'd save to a database)
    weightData.push({ weight, timestamp });
    
    // Keep only the last 100 entries to prevent memory issues
    if (weightData.length > 100) {
      weightData = weightData.slice(-100);
    }

    console.log(`[${new Date().toISOString()}] POST /api/weight - Stored weight: ${weight} kg at ${timestamp}`);
    res.status(200).json({ message: 'Weight data received', weight, timestamp });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/weight - Error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to receive hatchery data
app.post('/api/hatchery', (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/hatchery - Received body:`, req.body);
    const { temperature, humidity, trolleys, timestamp } = req.body;
    
    // Validate data
    if (typeof temperature !== 'number' || 
        typeof humidity !== 'number' || 
        !Array.isArray(trolleys) || 
        trolleys.length !== 6 ||
        !trolleys.every(t => typeof t === 'number')) {
      console.log(`[${new Date().toISOString()}] POST /api/hatchery - Invalid hatchery data`);
      return res.status(400).json({ error: 'Invalid hatchery data' });
    }

    // Store the data
    hatcheryData.push({ temperature, humidity, trolleys, timestamp: new Date().toISOString() });
    
    // Keep only the last 100 entries to prevent memory issues
    if (hatcheryData.length > 100) {
      hatcheryData = hatcheryData.slice(-100);
    }

    console.log(`[${new Date().toISOString()}] POST /api/hatchery - Stored hatchery data: T=${temperature}°C, H=${humidity}%RH, Trolleys=[${trolleys.join(', ')}]`);
    res.status(200).json({ message: 'Hatchery data received', temperature, humidity, trolleys, timestamp });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/hatchery - Error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get all weight data
app.get('/api/weight', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/weight - Fetching all weight data`);
  res.status(200).json(weightData);
});

// API endpoint to get all hatchery data
app.get('/api/hatchery', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/hatchery - Fetching all hatchery data`);
  res.status(200).json(hatcheryData);
});

// Basic health check
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET / - Health check requested`);
  res.send('Weight Tracking Server is running made by safal');
});

app.get('/sayhi', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /sayhi - Say hi requested`);
  res.send('Hi safal');
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server started on port ${PORT}`);
});