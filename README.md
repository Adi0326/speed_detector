# Speed Detector - Local IoT Web Application

A full-stack web application to capture and display real-time speed data from Arduino via USB serial connection.

## Project Structure

```
speed-detector/
├── backend/                 # Node.js backend
│   ├── server.js           # Express server & WebSocket
│   ├── database.js         # SQLite database setup
│   ├── serialHandler.js    # Arduino serial data reader
│   ├── package.json        # Dependencies
│   └── speed_detector.db   # SQLite database (auto-created)
├── frontend/               # Web interface
│   ├── index.html          # HTML structure
│   ├── styles.css          # Styling
│   └── app.js              # Frontend logic
├── arduino/                # Arduino code
│   └── speed_detector.ino  # Arduino sketch
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Arduino IDE
- Arduino board with USB cable

### Step 1: Arduino Setup
1. Open `arduino/speed_detector.ino` in Arduino IDE
2. Connect your Arduino via USB cable
3. Select correct board and COM port in Tools menu
4. Upload the sketch to Arduino

### Step 2: Backend Setup
1. Navigate to backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Update COM port in `server.js` if needed (default: COM3)
4. Start the server: `npm start`
   - Server runs on `http://localhost:3000`
   - Database auto-created as `speed_detector.db`

### Step 3: Frontend Access
1. Open web browser
2. Go to `http://localhost:3000`
3. You should see the live speed table with auto-refreshing data

## Configuration

### Arduino Serial Format
The Arduino sends data as: `objectNo,speed\n`
Example: `1,45.6\n`

### Changing COM Port (Windows)
Edit `backend/server.js` line with `const PORT = 'COM3'` to match your Arduino COM port.

### Changing COM Port (macOS/Linux)
Use `/dev/ttyUSB0` or `/dev/ttyACM0` instead of COM3.

### Baud Rate
Default: 9600 (Arduino & backend configured to match)

## Features
- ✅ Real-time serial data capture from Arduino
- ✅ Automatic database storage (ObjectNo, Speed, Date, Time)
- ✅ Live web interface with auto-refresh every second
- ✅ SQLite persistent storage
- ✅ WebSocket for real-time updates
- ✅ Responsive table display

## Troubleshooting

**Backend won't start?**
- Check if Node.js is installed: `node -v`
- Verify COM port is correct
- Check if port 3000 is already in use

**No data appearing?**
- Verify Arduino is uploading data (check Serial Monitor)
- Confirm baud rate matches (9600)
- Check serial cable connection

**Frontend shows blank?**
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for errors (F12)
- Verify backend is running

## API Endpoints

- `GET /api/records` - Fetch all speed records
- `GET /` - Serve frontend
- WebSocket: Auto-push new records to connected clients
