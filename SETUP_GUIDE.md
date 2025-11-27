# Speed Detector - Detailed Setup Guide

Complete step-by-step instructions for setting up the Speed Detector application on your system.

## Part 1: Arduino Setup

### Step 1.1: Install Arduino IDE
1. Download from [arduino.cc](https://www.arduino.cc/en/software)
2. Install for your operating system (Windows, macOS, or Linux)

### Step 1.2: Install Required Libraries
1. Open Arduino IDE
2. Go to **Sketch** → **Include Library** → **Manage Libraries**
3. Search for and install:
   - None needed for this project (uses built-in Serial library)

### Step 1.3: Upload Code to Arduino
1. Open `arduino/speed_detector.ino` in Arduino IDE
2. Connect Arduino to your computer via USB cable
3. Select **Tools** → **Board** → Choose your Arduino model (e.g., Arduino Uno)
4. Select **Tools** → **Port** → Choose the COM port (e.g., COM3, /dev/ttyUSB0)
5. Click the **Upload** button (➜)
6. Wait for "Upload Complete" message

### Step 1.4: Verify Arduino is Sending Data
1. Open **Tools** → **Serial Monitor**
2. Set baud rate to **9600**
3. You should see data like `1,45.6` appearing every 2 seconds
4. Close Serial Monitor when done

**Note:** The provided Arduino code generates random simulated data. Replace the `loop()` function with your actual sensor reading code.

---

## Part 2: Backend Setup

### Step 2.1: Install Node.js
1. Download from [nodejs.org](https://nodejs.org)
2. Install LTS version
3. Verify installation:
   ```bash
   node -v
   npm -v
   ```

### Step 2.2: Navigate to Backend Folder
```bash
cd speed-detector/backend
```

### Step 2.3: Install Dependencies
```bash
npm install
```

This installs:
- **express**: Web server framework
- **sqlite3**: Database
- **serialport**: Arduino communication
- **ws**: WebSocket for real-time updates
- **cors**: Cross-origin requests

### Step 2.4: Configure Arduino Port
Edit `server.js` and find this line:
```javascript
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3';
```

**For Windows:**
- Change `'COM3'` to your Arduino COM port (e.g., `'COM5'`, `'COM8'`)
- Find your COM port in Device Manager or Arduino IDE Tools menu

**For macOS:**
- Change to `/dev/tty.usbserial-*` or `/dev/tty.usbmodem*`
- List ports: `ls /dev/tty.usb*`

**For Linux:**
- Change to `/dev/ttyUSB0` or `/dev/ttyACM0`
- List ports: `ls /dev/tty*`

### Step 2.5: Start Backend Server
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
Connected to Arduino on COM3 at 9600 baud
Arduino connection established
```

If Arduino connection fails, verify:
1. Arduino is powered on and connected
2. COM port number is correct
3. Baud rate matches Arduino (9600)
4. Arduino sketch was successfully uploaded

---

## Part 3: Frontend Access

### Step 3.1: Open Web Browser
1. Open Chrome, Firefox, Safari, or Edge
2. Go to: `http://localhost:3000`
3. You should see the Speed Detector dashboard

### Step 3.2: View Live Data
- Table shows incoming records from Arduino
- Table auto-refreshes every second
- Stats cards show current, average, and max speeds
- Status badge shows connection status

---

## Alternative: Using Environment Variables

Instead of editing `server.js`, you can set environment variables:

**Windows (PowerShell):**
```powershell
$env:ARDUINO_PORT = 'COM5'
npm start
```

**Windows (Command Prompt):**
```cmd
set ARDUINO_PORT=COM5
npm start
```

**macOS/Linux:**
```bash
export ARDUINO_PORT=/dev/ttyUSB0
npm start
```

---

## Troubleshooting

### Backend won't start
**Problem:** `Error: EADDRINUSE: address already in use :::3000`
- **Solution:** Port 3000 is in use. Stop other services or use: `npm start -- --port 3001`

**Problem:** `Cannot find module 'serialport'`
- **Solution:** Run `npm install` in backend folder

### Arduino connection fails
**Problem:** `Error: Cannot open port COM3`
- **Solution:** 
  1. Check correct COM port in Device Manager or Arduino IDE
  2. Close Serial Monitor in Arduino IDE
  3. Disconnect and reconnect Arduino
  4. Restart backend server

**Problem:** `Error: ENOENT`
- **Solution:** Arduino is not connected or wrong COM port is configured

### No data appearing in dashboard
**Problem:** Dashboard loads but shows "No data yet"
- **Solution:**
  1. Check backend console for error messages
  2. Verify Arduino Serial Monitor shows data
  3. Check WebSocket status (F12 → Console)
  4. Restart backend and Arduino

**Problem:** Table shows old data, not updating
- **Solution:**
  1. Hard refresh browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
  2. Check WebSocket connection in browser console

### Database issues
**Problem:** `Error opening database`
- **Solution:**
  1. Delete `backend/speed_detector.db`
  2. Restart backend (database auto-creates)

**Problem:** Database not saving records
- **Solution:**
  1. Check backend console for insert errors
  2. Verify SQLite3 installed correctly: `npm list sqlite3`

---

## File Explanations

### Arduino Files
- **speed_detector.ino**: Main Arduino sketch that reads sensors and sends data via Serial

### Backend Files
- **server.js**: Express server, WebSocket setup, API endpoints
- **serialHandler.js**: Opens serial connection to Arduino, parses data
- **database.js**: SQLite database operations (create, insert, read)
- **package.json**: Dependencies and npm scripts
- **speed_detector.db**: SQLite database (auto-created)

### Frontend Files
- **index.html**: Web page structure
- **styles.css**: Responsive styling and animations
- **app.js**: JavaScript logic for table updates and WebSocket

---

## Next Steps

1. **Modify Arduino Code**: Replace simulated data with real sensor readings
2. **Customize Data**: Add more fields to database (location, vehicle ID, etc.)
3. **Export Data**: Add CSV export functionality
4. **Data Retention**: Modify database cleanup in database.js
5. **Authentication**: Add user login if needed
6. **Mobile Access**: Access dashboard from other devices on your network

---

## Command Reference

```bash
# Navigate to backend
cd speed-detector/backend

# Install dependencies
npm install

# Start server (development)
npm start

# View database (requires sqlite3 CLI)
sqlite3 speed_detector.db "SELECT * FROM speed_records;"

# Stop server
Ctrl+C

# Delete database and start fresh
rm speed_detector.db
npm start
```

---

## Technical Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Backend | Node.js + Express | 14+ |
| Frontend | HTML5 + CSS3 + JavaScript ES6 | Modern Browsers |
| Database | SQLite | 3 |
| Real-time | WebSocket | ws 8.14.2 |
| Serial | serialport | 11.0.0 |

---

For additional help, check:
- Arduino IDE Console for upload errors
- Browser Console (F12) for frontend errors
- Backend console for server/database errors
