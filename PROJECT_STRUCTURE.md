# Project Structure and File Explanations

## Directory Layout

```
Speed_detector/
├── README.md                 # Quick start guide
├── SETUP_GUIDE.md           # Detailed setup instructions
├── PROJECT_STRUCTURE.md     # This file
├── .gitignore               # Git ignore rules
├── 
├── arduino/
│   └── speed_detector.ino   # Arduino sketch for reading sensors
│
├── backend/
│   ├── server.js            # Express server and WebSocket handler
│   ├── serialHandler.js     # Serial port communication with Arduino
│   ├── database.js          # SQLite database operations
│   ├── package.json         # Node.js dependencies
│   └── speed_detector.db    # SQLite database (auto-created)
│
└── frontend/
    ├── index.html           # Web page HTML structure
    ├── styles.css           # CSS styling and responsive design
    └── app.js               # JavaScript frontend logic
```

---

## File Details

### 📋 Root Files

#### `README.md`
- **Purpose**: Quick start guide and project overview
- **Content**: Setup steps, features, troubleshooting basics
- **Audience**: First-time users

#### `SETUP_GUIDE.md`
- **Purpose**: Detailed setup instructions for each OS
- **Content**: Arduino setup, Node.js installation, environment config
- **Audience**: Users needing detailed guidance

#### `PROJECT_STRUCTURE.md`
- **Purpose**: File explanations and architecture
- **Content**: This document

#### `.gitignore`
- **Purpose**: Specify files to exclude from Git
- **Excludes**: `node_modules/`, database files, logs

---

### 🤖 Arduino Files (`arduino/`)

#### `speed_detector.ino`
**Purpose**: Microcontroller code that runs on Arduino

**Key Features:**
- Serial communication at 9600 baud
- Generates simulated speed data in format: `objectNo,speed`
- Sends data every 2 seconds
- Includes comments for integrating real sensors

**Function Flow:**
```
setup()
  → Initialize Serial at 9600 baud
  → Wait for connection
  
loop()
  → Generate/read speed data
  → Format as "1,45.6"
  → Send via Serial.println()
  → Wait 2 seconds
  → Repeat
```

**Modification for Real Sensors:**
Replace the random data generation in `loop()` with:
```cpp
objectNo = readObjectSensor();    // Your sensor code
speed = readSpeedSensor();         // Your sensor code
```

---

### 🖥️ Backend Files (`backend/`)

#### `server.js`
**Purpose**: Main Express server and WebSocket handler

**Responsibilities:**
- Start HTTP server on port 3000
- Serve frontend static files (HTML, CSS, JS)
- Handle API endpoints (`/api/records`, `/api/status`)
- Manage WebSocket connections for real-time updates
- Initialize Arduino connection on startup

**Key Routes:**
```
GET  /                → Serve frontend (index.html)
GET  /api/records     → Return last 100 records from DB
GET  /api/status      → Return connection status
WS   /                → WebSocket for real-time updates
```

**Connection Flow:**
```
Server starts
  → Tries to connect to Arduino on ARDUINO_PORT
  → Sets up database
  → Waits for browser connections
  → Broadcasts new speed data to connected clients via WebSocket
```

**Environment Variables:**
- `PORT`: Web server port (default: 3000)
- `ARDUINO_PORT`: Serial port (default: COM3)

#### `serialHandler.js`
**Purpose**: Manages serial communication with Arduino

**Main Functions:**
- `connectToArduino()`: Opens serial port and creates parser
- `processSerialData()`: Parses "objectNo,speed" format
- `setDataCallback()`: Register callback for new data
- `isSerialConnected()`: Check connection status
- `disconnectArduino()`: Safely close connection

**Data Flow:**
```
Arduino sends: "1,45.6\n"
  ↓
Parser reads line (removes "\n")
  ↓
processSerialData() parses: objectNo=1, speed=45.6
  ↓
insertSpeedRecord() saves to database
  ↓
dataCallback() broadcasts to frontend via WebSocket
```

**Error Handling:**
- Validates data format before saving
- Skips invalid entries with warning
- Auto-reconnects on connection loss
- Logs all errors to console

#### `database.js`
**Purpose**: SQLite database management

**Database Schema:**
```sql
CREATE TABLE speed_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  objectNo INTEGER NOT NULL,
  speed REAL NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Main Functions:**
- `initializeDatabase()`: Create table if not exists
- `insertSpeedRecord()`: Add new record with auto-date/time
- `getAllRecords()`: Fetch last 100 records
- `getRecentRecords()`: Fetch with limit parameter
- `clearOldRecords()`: Delete records older than X days
- `closeDatabase()`: Safe shutdown

**Date/Time Format:**
- Date: `DD/MM/YYYY` (example: `24/11/2025`)
- Time: `HH:MM:SS` (24-hour format, example: `14:30:45`)

#### `package.json`
**Purpose**: Node.js project configuration and dependencies

**Key Dependencies:**
- `express@^4.18.2`: Web framework
- `sqlite3@^5.1.6`: Database driver
- `serialport@^11.0.0`: Serial communication
- `ws@^8.14.2`: WebSocket library
- `cors@^2.8.5`: Cross-Origin Resource Sharing

**Scripts:**
```bash
npm start    # Start production server
npm dev      # Start with auto-restart (requires nodemon)
```

---

### 🎨 Frontend Files (`frontend/`)

#### `index.html`
**Purpose**: Web page structure

**Main Sections:**
1. **Header**: Title, connection status, last update time
2. **Stats Container**: Cards showing statistics
   - Total Records count
   - Current Speed
   - Average Speed
   - Maximum Speed
3. **Table Container**: Live records table with columns:
   - Object No
   - Speed (km/h)
   - Date
   - Time
4. **Footer**: Application info

**Dynamic Elements:**
- Status badge updates with WebSocket connection state
- Table rows automatically added/removed
- Statistics recalculate on each update

#### `styles.css`
**Purpose**: Responsive styling and animations

**Design Features:**
- **Color Scheme**: Blue primary, green success, red danger
- **Responsive Grid**: 4-column on desktop, adapts to mobile
- **Animations**: Fade-in effects for new rows
- **Accessibility**: High contrast text, readable fonts
- **Mobile Support**: Breakpoints at 768px and 480px

**Key Classes:**
- `.container`: Main wrapper (max-width 1200px)
- `.stat-card`: Individual statistic boxes
- `.table-container`: Scrollable table wrapper
- `.new-row`: Highlight newly added records
- `.status-badge`: Connection status indicator

**Responsive Design:**
```
Desktop (>768px)     → 4-column grid for stats
Tablet (768px)       → 2-column grid for stats
Mobile (<480px)      → 1-column layout
```

#### `app.js`
**Purpose**: Frontend logic and real-time updates

**SpeedDetectorDashboard Class:**
- Manages all frontend state and interactions
- Handles WebSocket connection and reconnection
- Updates UI with database records

**Main Methods:**
- `init()`: Initialize on page load
- `loadInitialData()`: Fetch existing records from API
- `setupWebSocket()`: Connect to server for real-time updates
- `addNewRecord()`: Add record to display
- `updateDisplay()`: Refresh table and statistics
- `updateStats()`: Calculate and show statistics
- `updateTable()`: Render records in HTML table

**Auto-Refresh Logic:**
```
1. WebSocket connected → Receives new records in real-time
2. Every 1 second → Fetch from /api/records (backup refresh)
3. Manual refresh → User clicks refresh button
```

**Reconnection Strategy:**
- Max attempts: 5
- Delay between attempts: 3 seconds
- Auto-reconnects on disconnection

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ARDUINO SKETCH                         │
│  Reads sensors → Formats "objectNo,speed" → Sends via USB   │
└─────────────────────────────────────────────────────────────┘
                            ↓ USB Cable
┌─────────────────────────────────────────────────────────────┐
│                    SERIAL HANDLER                           │
│  ├─ Listens on COM port                                     │
│  ├─ Parses "1,45.6" format                                  │
│  └─ Validates data                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                 │
│  ├─ Receives: objectNo, speed, date, time                  │
│  ├─ Stores in SQLite                                        │
│  └─ Provides query interface                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS SERVER                             │
│  ├─ Serves /api/records                                     │
│  ├─ Broadcasts via WebSocket                                │
│  └─ Broadcasts to all connected browsers                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                BROWSER / FRONTEND                           │
│  ├─ Receives updates via WebSocket                          │
│  ├─ Updates table with new records                          │
│  ├─ Calculates statistics                                   │
│  └─ Displays in HTML interface                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Microcontroller** | Arduino C++ | Read sensors, send data |
| **Backend** | Node.js + Express | Process data, store in DB |
| **Database** | SQLite | Persistent storage |
| **Real-time** | WebSocket (ws) | Live updates to browser |
| **Frontend** | HTML5 + CSS3 + JS ES6 | User interface |
| **Communication** | Serial (USB) + HTTP + WebSocket | Data transmission |

---

## Key Features Implementation

### ✅ Real-time Updates
- WebSocket broadcasts new records immediately
- Fallback API polling every 1 second

### ✅ Persistent Storage
- SQLite database automatically saves all records
- Survives server restart

### ✅ Responsive Design
- Mobile-friendly layout
- Auto-refresh works on all devices

### ✅ Error Handling
- Serial connection validation
- Database constraint checking
- WebSocket reconnection logic
- User-friendly error messages

### ✅ Performance
- Limits records displayed (50 in table)
- Keeps 1000 records in memory
- Efficient database queries with LIMIT clause
