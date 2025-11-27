# Troubleshooting Guide

Quick solutions for common issues.

## Common Issues and Solutions

### 🔴 Backend Issues

#### "npm ERR! Cannot find module 'serialport'"
**Cause**: Dependencies not installed
**Solution**:
```bash
cd backend
npm install
```

#### "Error: EADDRINUSE: address already in use :::3000"
**Cause**: Port 3000 is already in use
**Solution**: 
- Find process: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill process or use different port: `PORT=3001 npm start`

#### "Cannot open port COM3"
**Cause**: Arduino not connected or wrong COM port
**Solution**:
1. Check Arduino is connected via USB
2. Find correct port:
   - **Windows**: Device Manager → COM Ports
   - **Mac**: `ls /dev/tty.usb*`
   - **Linux**: `ls /dev/ttyUSB*`
3. Update `ARDUINO_PORT` in `server.js`

#### Backend runs but shows "Disconnected" status
**Cause**: Arduino connection failed but backend started anyway
**Solution**:
1. Check Arduino Serial Monitor shows data
2. Verify COM port is correct
3. Ensure baud rate is 9600
4. Restart backend after fixing

#### Database showing empty
**Cause**: Database file corrupted or not writable
**Solution**:
```bash
# Delete existing database
rm backend/speed_detector.db

# Restart backend (auto-creates new database)
npm start
```

---

### 🌐 Frontend Issues

#### Dashboard page won't load (blank page)
**Cause**: Backend not running
**Solution**:
1. Check if backend is running: `npm start` in backend folder
2. Verify URL is `http://localhost:3000`
3. Check browser console (F12) for errors

#### Table shows "No data yet" but backend shows data
**Cause**: WebSocket not connected or CORS issue
**Solution**:
1. Hard refresh browser: **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
2. Check browser console (F12) for WebSocket errors
3. Verify backend console shows "New client connected"
4. Check CORS configuration in `server.js`

#### Table data not updating
**Cause**: WebSocket closed or polling disabled
**Solution**:
1. Check WebSocket status in browser console
2. Restart backend: `Ctrl+C` then `npm start`
3. Refresh browser page
4. Check browser Network tab (F12) for connection status

#### Dashboard works but no Arduino data appearing
**Cause**: Arduino not sending data or wrong format
**Solution**:
1. Open Arduino Serial Monitor (Tools → Serial Monitor)
2. Set baud to 9600
3. Verify data format: `1,45.6` (objectNo,speed)
4. Check Arduino sketch uploaded successfully
5. Look at backend console for parse errors

#### Statistics showing "-- km/h"
**Cause**: No records in database yet
**Solution**:
1. Wait for Arduino to send data (every 2 seconds)
2. Check backend console for "Recorded:" messages
3. Verify database has records: `sqlite3 backend/speed_detector.db "SELECT COUNT(*) FROM speed_records;"`

---

### 📡 Arduino Issues

#### Arduino IDE can't upload sketch
**Cause**: Wrong board or COM port selected
**Solution**:
1. **Tools** → **Board** → Select correct board (Arduino Uno, Nano, etc.)
2. **Tools** → **Port** → Select correct COM port
3. Disconnect/reconnect Arduino
4. Try uploading again

#### Serial Monitor shows nothing
**Cause**: Sketch not uploaded or wrong baud rate
**Solution**:
1. Verify sketch upload completed
2. Set baud rate to **9600** (matching sketch)
3. Restart Arduino (disconnect/reconnect USB)
4. Check Arduino board LED (should blink when powered)

#### Serial Monitor shows garbled text
**Cause**: Baud rate mismatch
**Solution**:
1. Sketch uses 9600 baud
2. Set Serial Monitor to 9600
3. Restart Serial Monitor
4. If still garbled, try other baud rates (38400, 115200)

#### Arduino keeps disconnecting
**Cause**: USB cable issue or loose connection
**Solution**:
1. Try different USB cable
2. Try different USB port
3. Try different USB hub
4. Try Arduino on different computer to verify hardware

#### COM port disappears when Arduino connected
**Cause**: Driver not installed
**Solution**:
- **Windows**: Download CH340 driver (for clone boards) or FTDI driver
- **Mac**: Install official Arduino or CH340 drivers
- **Linux**: Drivers usually pre-installed; try: `sudo apt-get install arduino`

---

### 🗄️ Database Issues

#### "Error creating table"
**Cause**: Database file corrupted or permission issue
**Solution**:
```bash
# Backup and delete
mv backend/speed_detector.db backend/speed_detector.db.bak
npm start
```

#### Database not saving records
**Cause**: Insert permission denied or disk full
**Solution**:
1. Check disk space: `df -h` (Mac/Linux) or `disk usage` (Windows)
2. Check file permissions: `ls -la backend/speed_detector.db`
3. Try recreating database (see above)

#### Old data still in database
**Cause**: Clearing function not called
**Solution**:
Manually clear records:
```bash
sqlite3 backend/speed_detector.db "DELETE FROM speed_records;"
```

---

### 🔧 Configuration Issues

#### Changed COM port but backend still uses old one
**Cause**: Environment variable or hardcoded value not updated
**Solution**:
1. Edit `backend/server.js` line: `const ARDUINO_PORT = 'COM3'`
2. Change `'COM3'` to correct port
3. Save and restart backend: `npm start`

#### Baud rate mismatch
**Cause**: Arduino and backend configured differently
**Solution**:
1. Arduino sketch has: `Serial.begin(9600)`
2. Backend has: `baudRate: 9600`
3. Arduino IDE Serial Monitor: 9600
4. All three must match

---

## Diagnostic Steps

### 1️⃣ Check Arduino
```
Does Arduino Serial Monitor show: 1,45.6 format?
↓ YES → Go to step 2
↓ NO → Upload sketch and verify
```

### 2️⃣ Check Backend
```
Is backend running with "Connected to Arduino" message?
↓ YES → Go to step 3
↓ NO → Check COM port and restart backend
```

### 3️⃣ Check Database
```bash
# See if records are saved
sqlite3 backend/speed_detector.db
sqlite> SELECT COUNT(*) FROM speed_records;
```
```
Count > 0?
↓ YES → Go to step 4
↓ NO → Check backend console for insert errors
```

### 4️⃣ Check Frontend
```
Does page load at http://localhost:3000?
↓ YES → Hard refresh (Ctrl+F5)
↓ NO → Ensure backend is running
```

### 5️⃣ Check WebSocket
```
F12 → Network tab → Search for "ws://localhost"
Connected?
↓ YES → Working correctly!
↓ NO → Check browser console for errors
```

---

## Advanced Debugging

### View Real-time Database
```bash
# Terminal 1: Watch database
watch -n 1 'sqlite3 backend/speed_detector.db "SELECT * FROM speed_records ORDER BY id DESC LIMIT 10;"'

# Or Mac:
watch -n 1 'sqlite3 backend/speed_detector.db "SELECT * FROM speed_records ORDER BY id DESC LIMIT 10;"'
```

### Enable Verbose Logging
Edit `backend/serialHandler.js` and uncomment debug lines:
```javascript
console.log('Raw data received:', rawData);
console.log('Parsed:', { objectNo, speed });
```

### Check Port Availability
```bash
# Mac/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Kill process
kill -9 <PID>
```

### Monitor Network Traffic
1. Open browser F12 → Network tab
2. Filter: `XHR` (for API calls)
3. Refresh page and check requests

---

## When to Contact Support

If you've tried all above steps, provide:
1. Full error message from backend console
2. Browser console errors (F12)
3. Arduino Serial Monitor output (first 10 lines)
4. Operating system and node version (`node -v`)
5. Arduino board model
6. COM port number

---

## Quick Reset

If nothing works, try complete reset:

```bash
# 1. Stop backend (Ctrl+C)

# 2. Delete database
rm backend/speed_detector.db

# 3. Delete node modules and reinstall
rm -rf backend/node_modules
npm install

# 4. Restart Arduino
# Disconnect and reconnect USB

# 5. Start backend
npm start

# 6. Refresh browser (Ctrl+F5)
```

This usually fixes 90% of issues!
