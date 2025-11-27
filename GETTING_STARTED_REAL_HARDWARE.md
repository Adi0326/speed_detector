# Getting Started with Real Hardware

Setup guide for your actual IR sensor-based speed detector with Arduino.

## Two Options Available

### Option 1: Web Serial Viewer (Easy, Browser-based)
- **Pros**: No backend needed, works directly in browser, instant CSV download
- **Cons**: Chrome/Edge only, no persistent database
- **Best for**: Quick testing, temporary data collection

### Option 2: Node.js Backend + Dashboard (Professional, Persistent)
- **Pros**: Persistent SQLite database, web dashboard, WebSocket updates
- **Cons**: Requires Node.js installation
- **Best for**: Production use, long-term data collection

**Recommendation**: Use **Web Serial Viewer** first to verify hardware, then set up Node.js backend for persistent storage.

---

## Quick Setup Summary

```
Hardware:
  - 2x IR Sensors on pins 2 & 3
  - 16x2 LCD I2C (address 0x27)
  - Upload arduino/speed_detector.ino

Option 1 - Web Serial (Browser):
  - Open frontend/web-serial-viewer.html in Chrome/Edge
  - Click "Connect Arduino"
  - Select your COM port
  - Watch data flow in real-time

Option 2 - Node.js (Persistent):
  - Run: cd backend && npm install && npm start
  - Open http://localhost:3000
  - Data saves to SQLite database
```

---

## Step 1: Verify Hardware

### Check Arduino Connected
```bash
# macOS/Linux
ls /dev/tty*

# Windows
# Go to Device Manager → COM Ports
# Look for "Arduino" entry
```

### Verify Serial Output
1. Open Arduino IDE
2. Tools → Serial Monitor
3. Set baud rate to **9600**
4. Pass an object between sensors
5. Should see:
   ```
   Time = 0.445000 s | Speed: 0.00010115 km/s
   CSV:12345,1,45.30
   ```

✅ If you see this, hardware is working!

---

## Option 1: Web Serial Viewer (Recommended for Testing)

### Step 1: Open Viewer
1. Open Chrome or Edge browser
2. Open file: `frontend/web-serial-viewer.html`
   - Or: Drag file into browser
   - Or: Use VS Code Live Server extension

### Step 2: Connect Arduino
1. Click 🔌 **Connect Arduino** button
2. Browser will show port selection dialog
3. Select your Arduino COM port
4. Click "Connect"

You should see:
```
✓ Connected at 9600 baud
[speed data appearing in log]
```

### Step 3: Test Detection
1. Position objects between IR sensors
2. Watch **Live Statistics** update:
   - Last Speed
   - Average Speed
   - Max/Min Speed
   - Chart visualization
3. Check **Speed Records** table for detailed data

### Step 4: Export Data
Click ⬇️ **Download CSV** to save measurements:
```
speed_data_1732464723.csv

Index,Session,Object,Speed (km/h),Time (s),Timestamp
1,45230,1,45.30,0.445000,14:35:22
2,45230,2,47.80,0.418000,14:35:24
...
```

### Advanced: Keep Viewer Open During Testing
- Window stays open while collecting data
- Accumulates up to 100 records in memory
- Download CSV before closing to preserve data

---

## Option 2: Node.js Backend (For Persistent Storage)

### Prerequisites
1. **Node.js** installed (v14+)
   ```bash
   node --version  # Should show v14.0.0 or higher
   ```

2. **Backend folder** exists: `backend/`

### Step 1: Install Dependencies
```bash
cd Speed_detector/backend
npm install
```

This installs:
- Express (web server)
- SQLite (database)
- serialport (Arduino communication)
- ws (WebSocket)

### Step 2: Update COM Port
Edit `backend/server.js` line 9:

**Windows:**
```javascript
const ARDUINO_PORT = 'COM3';  // Change COM3 to your port
```

**macOS:**
```javascript
const ARDUINO_PORT = '/dev/tty.usbserial-1460';  // Your port
```

**Linux:**
```javascript
const ARDUINO_PORT = '/dev/ttyUSB0';  // Or /dev/ttyACM0
```

### Step 3: Start Backend Server
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
Connected to Arduino on COM3 at 9600 baud
Arduino connection established
```

✅ Backend is running!

### Step 4: Open Dashboard
1. Open browser
2. Go to: `http://localhost:3000`
3. You should see:
   - Live statistics cards
   - Auto-updating table
   - Connection status badge

### Step 5: Start Detection
1. Pass objects between sensors
2. Dashboard updates in real-time
3. Table shows: Session | Object No | Speed | Date | Time
4. Statistics recalculate automatically

### Step 6: Data Persists
Data automatically saved to `backend/speed_detector.db`

To view database:
```bash
sqlite3 backend/speed_detector.db
sqlite> SELECT * FROM speed_records;
sqlite> SELECT COUNT(*) FROM speed_records;  # Total records
```

---

## Data Format Sent by Arduino

### Session Start
```
=== Speed Detector Started ===
Session ID: 12345
```

### Each Detection (Dual Format)
```
Time = 0.445000 s | Speed: 0.00010115 km/s
CSV:12345,1,45.30
```

**CSV Format Breakdown:**
- `12345` = Session ID (changes on power-up)
- `1` = Object number in this session
- `45.30` = Speed in km/h

### Conversion Notes
- Arduino sends speed in km/s internally
- Backend converts to km/h for display
- Web Serial Viewer handles both formats
- Database stores in km/h

---

## Troubleshooting

### "No data appearing in dashboard"
1. ✓ Check Arduino Serial Monitor shows data (F12 → Tools → Serial)
2. ✓ Verify correct COM port in `server.js`
3. ✓ Restart backend: `npm start`
4. ✓ Hard refresh browser: Ctrl+F5

### "Cannot connect to Arduino"
```
Error: Cannot open port COM3
```
1. Check Device Manager for actual COM port
2. Ensure Arduino IDE Serial Monitor is closed
3. Verify USB cable is connected
4. Try disconnecting/reconnecting Arduino
5. Update `server.js` with correct port

### "Web Serial Viewer shows blank"
- **Chrome/Edge only** (Firefox/Safari don't support Web Serial API)
- Try opening as file: `File → Open File` → select `web-serial-viewer.html`
- Or use HTTP server (not file://)

### "Data in database but not showing in dashboard"
1. Hard refresh browser: Ctrl+F5
2. Check browser console (F12) for JavaScript errors
3. Verify WebSocket connection in Network tab
4. Restart backend

### "Previous session data still showing"
To clear database:
```bash
# Stop backend first (Ctrl+C)
rm backend/speed_detector.db
npm start  # Auto-recreates empty database
```

---

## Comparison Table

| Feature | Web Serial Viewer | Node.js Backend |
|---------|-------------------|-----------------|
| Browser Support | Chrome/Edge only | All browsers |
| Requires Node.js | ❌ No | ✅ Yes |
| Persistent Storage | ❌ Memory only | ✅ SQLite |
| Max Records | 100 in memory | Unlimited |
| Real-time Updates | ✅ Yes | ✅ Yes (WebSocket) |
| CSV Export | ✅ Yes | ✅ Via frontend |
| Complexity | ⭐ Easy | ⭐⭐ Medium |
| Best Use | Testing | Production |

---

## Session Tracking Explained

Each time Arduino boots:
1. **New Session ID** generated (based on uptime in seconds)
2. **Object Counter** resets to 1
3. Each object detected increments counter
4. All objects share same session ID

Example:
```
Boot #1:
  Session ID: 12345
  Object 1 at 45.3 km/h
  Object 2 at 47.8 km/h

Boot #2:
  Session ID: 15000  (new session)
  Object 1 at 42.1 km/h
  Object 2 at 44.5 km/h
```

You can filter data by session in database:
```sql
SELECT * FROM speed_records WHERE sessionId = 12345;
```

---

## Performance Tips

### For Accurate Speed Measurements
1. **Smooth objects** (round objects give most consistent readings)
2. **Perpendicular motion** (object should cross sensors at 90°)
3. **Consistent speed** (steady motion gives better average)
4. **Repeated tests** (average multiple runs)

### For High-Speed Testing
1. Ensure sensors are properly aligned
2. Increase distance between sensors slightly
3. Test with different object sizes
4. Note readings on LCD during test

### Data Collection Best Practices
1. Use **Web Serial Viewer** for quick tests
2. Use **Node.js Backend** for production runs
3. Test calibration before collecting data
4. Document sensor distance in CLAUDE.md or notes
5. Export CSV after each session

---

## Next Steps

### After Successful Test
1. ✅ Verify hardware works with Web Serial Viewer
2. ✅ Set up Node.js backend for persistence
3. → Configure distance between sensors
4. → Test with various objects
5. → Collect data for your project

### Modifying Arduino Code
- Edit sensor distance: `float distance_cm = 20.0;`
- Add more sensors: Edit pins and loop logic
- Change LCD display: Edit lcd.print() statements

### Deploying
- Use external 5V power supply instead of USB
- Run on computer in lab/field
- Collect data to SQLite continuously
- Export CSV periodically

---

## File Organization

```
Speed_detector/
├── arduino/
│   └── speed_detector.ino        ← Upload this
├── frontend/
│   ├── web-serial-viewer.html    ← Open in browser (Option 1)
│   ├── index.html                ← For backend dashboard
│   ├── app.js
│   └── styles.css
├── backend/
│   ├── server.js                 ← npm start
│   ├── serialHandler.js
│   ├── database.js
│   ├── package.json
│   └── speed_detector.db         ← Data storage
├── README.md
└── ARDUINO_HARDWARE_SETUP.md
```

---

## Questions?

Check these files:
- **ARDUINO_HARDWARE_SETUP.md** - Hardware wiring and calibration
- **PROJECT_STRUCTURE.md** - How each component works
- **TROUBLESHOOTING.md** - Common issues and solutions

You're all set! Start with Web Serial Viewer to test, then graduate to Node.js backend. 🚗
