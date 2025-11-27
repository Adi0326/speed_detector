# Speed Detector - Quick Start (2 Minutes)

## ⚡ TL;DR - Get Running Fast

### Prerequisite Check
- [ ] Arduino uploaded with `arduino/speed_detector.ino`
- [ ] Node.js installed (`node -v` in terminal)
- [ ] Arduino connected to USB

### Quick Setup

**Terminal 1 - Start Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Open Frontend:**
```
Open browser → http://localhost:3000
```

✅ Done! You should see live data in the table.

---

## 📝 What's Included

```
Speed_detector/
├── 📄 README.md              ← Start here
├── 📄 SETUP_GUIDE.md         ← Detailed setup
├── 📄 PROJECT_STRUCTURE.md   ← File explanations
├── 📄 TROUBLESHOOTING.md     ← Problem solutions
├── 📄 QUICK_START.md         ← This file
│
├── 🤖 arduino/
│   └── speed_detector.ino    ← Upload to Arduino
│
├── 🖥️ backend/
│   ├── server.js             ← Main server
│   ├── serialHandler.js      ← Arduino communication
│   ├── database.js           ← SQLite setup
│   └── package.json          ← Dependencies
│
└── 🎨 frontend/
    ├── index.html            ← Web page
    ├── styles.css            ← Styling
    └── app.js                ← Live updates
```

---

## 🚀 What Each File Does

### Arduino
- **speed_detector.ino**: Sends data like `1,45.6` every 2 seconds

### Backend
- **server.js**: Web server on port 3000 + WebSocket broadcast
- **serialHandler.js**: Reads Arduino data from COM port
- **database.js**: Stores data in SQLite database
- **package.json**: Lists what npm packages to install

### Frontend
- **index.html**: Page structure with table
- **styles.css**: Beautiful responsive design
- **app.js**: Auto-update table, real-time WebSocket

---

## ⚙️ Configuration

Only need to change **one thing** if on Mac/Linux:

**Edit `backend/server.js` line 9:**
```javascript
// Windows users: Keep as 'COM3' (check Device Manager)
// Mac users: Change to '/dev/tty.usbserial-*' or '/dev/tty.usbmodem*'
// Linux users: Change to '/dev/ttyUSB0'

const ARDUINO_PORT = 'COM3';  // ← Change this
```

---

## 🔍 Verify Setup

### 1. Arduino Sending Data?
- Open Arduino IDE → Tools → Serial Monitor
- Set baud to 9600
- Should see: `1,45.6` format

### 2. Backend Running?
Terminal output should show:
```
Server running on http://localhost:3000
Connected to Arduino on COM3 at 9600 baud
Arduino connection established
```

### 3. Frontend Connected?
- Open `http://localhost:3000`
- Check browser console (F12): No red errors
- Status badge should show "✓ Connected"
- Table should fill with data

---

## 📊 The Data Flow

```
Arduino → (USB/Serial) → Backend → (WebSocket) → Frontend Browser
```

1. Arduino sends: `1,45.6`
2. Backend parses and saves to database
3. Frontend gets WebSocket update
4. Table shows new row instantly

---

## 🎯 Next Steps

### After Setup
1. **Customize Arduino**: Replace random data with real sensors
2. **Add Fields**: Edit database schema in `database.js`
3. **Export Data**: Add CSV download in frontend
4. **Multi-Device**: Access from other computers on network

### Accessing from Other Devices
Replace `localhost` with your computer IP:
- Find IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
- Example: `http://192.168.1.100:3000`

---

## 🛠️ Commands Reference

```bash
# Backend commands
cd backend
npm install              # First time only
npm start               # Start server

# Database
sqlite3 speed_detector.db
SELECT COUNT(*) FROM speed_records;  # Check record count

# Stop server
Ctrl+C

# Clear database
rm backend/speed_detector.db  # Next npm start recreates it
```

---

## ❌ Something Wrong?

### No data appearing?
```bash
# 1. Check Arduino sends data
# Open Serial Monitor in Arduino IDE at 9600 baud

# 2. Check backend console
# Should show: "Connected to Arduino on COM3"

# 3. Check correct COM port
Device Manager (Windows) → Ports → Find COM number
```

### Database empty?
```bash
# Delete and recreate
rm backend/speed_detector.db
npm start
```

### Frontend blank?
```bash
# 1. Make sure backend is running
# 2. Try hard refresh: Ctrl+F5
# 3. Check browser console for errors: F12
```

👉 **See TROUBLESHOOTING.md for complete solutions**

---

## 📞 Having Issues?

1. **Backend won't start**: Check Node.js installed
2. **Arduino won't connect**: Verify COM port
3. **No data showing**: Check Arduino Serial Monitor
4. **Frontend frozen**: Hard refresh browser (Ctrl+F5)

Full troubleshooting in **TROUBLESHOOTING.md**

---

## ✨ Features

- ✅ Real-time serial data capture
- ✅ Auto-save to SQLite database
- ✅ Live web dashboard with auto-refresh
- ✅ WebSocket for instant updates
- ✅ Responsive mobile design
- ✅ Statistics (Current, Average, Max speed)
- ✅ Connection status indicator

---

## 📱 Mobile Access

To access from phone/tablet on same WiFi:

1. Find computer IP:
   ```bash
   # Mac: 
   ipconfig getifaddr en0
   
   # Windows:
   ipconfig | findstr "IPv4"
   ```

2. Open in phone browser:
   ```
   http://YOUR_IP:3000
   ```

3. Example: `http://192.168.1.100:3000`

---

## 🎓 Learning Resources

- **arduino/speed_detector.ino**: How to send serial data
- **backend/serialHandler.js**: How to parse data
- **backend/database.js**: How to use SQLite
- **frontend/app.js**: How WebSocket works
- **frontend/styles.css**: Responsive CSS design

---

Ready? Start with:
```bash
cd backend && npm install && npm start
```

Then open: **http://localhost:3000** ✨
