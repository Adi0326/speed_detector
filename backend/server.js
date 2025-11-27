const express = require('express');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const XLSX = require('xlsx');

const { connectToArduino, disconnectArduino, setDataCallback, isSerialConnected } = require('./serialHandler');
const { getAllRecords, getRecentRecords, clearAllRecords, deleteRecordById, deleteRecordsByIds, getStatistics, getAdminByUsername, closeDatabase } = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const ARDUINO_PORT = process.env.ARDUINO_PORT || '/dev/tty.usbserial-1120';
const BAUD_RATE = 9600;
const JWT_SECRET = process.env.JWT_SECRET || 'speed_detector_secret_key_2024';

app.use(cors());
app.use(express.json());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Authentication middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Auth Routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await getAdminByUsername(username);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (admin.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, username: admin.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Protected API Routes
app.get('/api/records', verifyToken, async (req, res) => {
  try {
    const records = await getRecentRecords(100);
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.get('/api/status', verifyToken, (req, res) => {
  res.json({
    connected: isSerialConnected(),
    port: ARDUINO_PORT,
    baudRate: BAUD_RATE
  });
});

app.post('/api/clear', verifyToken, async (req, res) => {
  try {
    const deletedCount = await clearAllRecords();
    console.log(`Cleared ${deletedCount} records from database`);
    res.json({
      success: true,
      deleted: deletedCount,
      message: 'All records deleted from database'
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear database'
    });
  }
});

app.get('/api/statistics', verifyToken, async (req, res) => {
  try {
    const stats = await getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/export/excel', async (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  try {
    const records = await getAllRecords();
    
    const data = records.map(record => ({
      'Session ID': record.sessionId,
      'Object No': record.objectNo,
      'Speed (km/h)': parseFloat(record.speed).toFixed(2),
      'Date': record.date,
      'Time': record.time
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Speed Records');
    
    const fileName = `speed_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(__dirname, fileName);
    
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      setTimeout(() => {
        try {
          const fs = require('fs');
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

app.post('/api/delete-records', verifyToken, async (req, res) => {
  try {
    const { recordIds } = req.body;
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ error: 'No records selected for deletion' });
    }

    const deletedCount = await deleteRecordsByIds(recordIds);
    console.log(`Deleted ${deletedCount} records`);
    
    res.json({
      success: true,
      deleted: deletedCount,
      message: `${deletedCount} record(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ error: 'Failed to delete records' });
  }
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log(`New WebSocket client connected. Total clients: ${wss.clients.size}`);

  ws.on('message', (message) => {
    console.log('Received message from client:', message);
  });

  ws.on('close', () => {
    console.log(`Client disconnected. Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast data to all connected clients
function broadcastData(record) {
  const message = JSON.stringify({
    type: 'newRecord',
    data: {
      sessionId: record.sessionId,
      objectNo: record.objectNo,
      speed_km_h: parseFloat(record.speed),
      time_s: 0,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
    }
  });
  
  console.log(`Broadcasting to ${wss.clients.size} clients:`, message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start server
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Connect to Arduino
  try {
    await connectToArduino(ARDUINO_PORT, BAUD_RATE);
    setDataCallback(broadcastData);
    console.log('Arduino connection established');
  } catch (error) {
    console.error('Failed to connect to Arduino:', error.message);
    console.log('You can still access the dashboard, but no data will be collected');
    console.log(`To fix: Verify Arduino is connected to ${ARDUINO_PORT} and powered on`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await disconnectArduino();
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await disconnectArduino();
  closeDatabase();
  process.exit(0);
});
