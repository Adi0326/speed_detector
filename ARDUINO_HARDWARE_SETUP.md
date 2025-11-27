# Arduino Hardware Setup Guide

Complete setup instructions for the real IR sensor-based speed detector.

## Hardware Components Required

- **Arduino Board** (Uno, Nano, or compatible)
- **2x IR Sensors** (e.g., KY-032 or similar)
- **16x2 LCD Display** (I2C module, address 0x27)
- **USB Cable** (for Arduino programming and power)
- **Jumper Wires**
- **Power Supply** (optional, if running without USB)

## IR Sensor Pinout

### KY-032 IR Sensor (typical)
```
VCC → Arduino 5V
GND → Arduino GND
OUT → Arduino Digital Pin (2 or 3)
```

## Circuit Wiring

```
Arduino Pinout for Speed Detector
┌─────────────────────────────────┐
│       Arduino Board             │
├─────────────────────────────────┤
│ Pin 2 ────→ IR Sensor 1 (OUT)  │
│ Pin 3 ────→ IR Sensor 2 (OUT)  │
│             (Both sensors GND→GND, 5V→5V)
│
│ Pin SDA ──→ LCD I2C (SDA)      │
│ Pin SCL ──→ LCD I2C (SCL)      │
│ GND ──────→ LCD (GND)           │
│ 5V ───────→ LCD (VCC)           │
└─────────────────────────────────┘
```

## Step-by-Step Connection

### 1. IR Sensors
1. **Sensor 1** (triggers first):
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect OUT to Arduino **Pin 2**

2. **Sensor 2** (triggers second):
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect OUT to Arduino **Pin 3**

### 2. LCD Display (16x2 I2C)
1. Connect **SDA** to Arduino **SDA** (A4 on Uno, A0 on Nano)
2. Connect **SCL** to Arduino **SCL** (A5 on Uno, A1 on Nano)
3. Connect **GND** to Arduino **GND**
4. Connect **VCC** to Arduino **5V**

### 3. USB Connection
- Connect Arduino to computer via USB for programming
- Arduino will remain powered when connected to USB

## Setting Up Arduino IDE

### 1. Install Required Libraries
1. Open Arduino IDE
2. Go to **Sketch** → **Include Library** → **Manage Libraries**
3. Search and install:
   - **LiquidCrystal I2C** by Frank de Brabander
   - **Wire** (usually pre-installed)

### 2. Configure Board
1. Click **Tools** → **Board** → Select your Arduino model (Uno, Nano, etc.)
2. Click **Tools** → **Port** → Select your COM port
   - **Windows**: COM3, COM4, COM5, etc.
   - **macOS**: /dev/cu.usbserial-* or /dev/cu.usbmodem*
   - **Linux**: /dev/ttyUSB0 or /dev/ttyACM0

### 3. Adjust I2C Address if Needed
If your LCD display has a different I2C address (not 0x27):

1. Run the **I2C Scanner** sketch to find the address:
   ```cpp
   #include <Wire.h>
   void setup() {
     Serial.begin(9600);
     Wire.begin();
     Serial.println("I2C Scanner");
   }
   void loop() {
     for(int a=1; a<=127; a++) {
       Wire.beginTransmission(a);
       if(Wire.endTransmission() == 0) {
         Serial.print("Address: 0x");
         Serial.println(a, HEX);
       }
     }
     delay(5000);
   }
   ```

2. Note the address (e.g., 0x27)
3. Edit **speed_detector.ino** line 6:
   ```cpp
   LiquidCrystal_I2C lcd(0x27, 16, 2);  // Change 0x27 if needed
   ```

## Uploading the Sketch

1. Open `arduino/speed_detector.ino` in Arduino IDE
2. Click **Verify** button (✓) - compiles code, checks for errors
3. Fix any errors if compilation fails
4. Click **Upload** button (→) - uploads to Arduino
5. Wait for "Upload complete" message
6. Check LCD display - should show "Speed Detector" on startup

## Calibration

### Distance Between Sensors
The code uses a default distance of **20 cm** between sensors:

```cpp
float distance_cm = 20.0;    // Adjust to your actual distance
```

To adjust:
1. **Measure** the actual distance between your IR sensors
2. Edit the value in `speed_detector.ino` line 14
3. Re-upload the sketch

**Example:**
- If sensors are 15 cm apart: `float distance_cm = 15.0;`
- If sensors are 25 cm apart: `float distance_cm = 25.0;`

### Testing Speed Calculation
1. Move an object between sensors slowly
2. Note the time taken on LCD
3. Calculate: Speed = 20cm / time = distance / time
4. Compare with calculation: speed_cm_s / 100 / 1000 = speed_km_s

## Understanding the Output

### LCD Display Shows
```
Obj:1 Spd:45.3
km/h S12345
```
- **Obj:1** = Object #1 in current session
- **Spd:45.3** = Speed in km/h
- **S12345** = Session ID (based on boot time)

### Serial Output (Text Format)
```
=== Speed Detector Started ===
Session ID: 12345
Time = 0.445000 s | Speed: 0.00010115 km/s
CSV:12345,1,45.30
```

### Serial Output (CSV Format)
Used by Node.js backend:
```
CSV:sessionId,objectNo,speed_km_h
CSV:12345,1,45.30
CSV:12345,2,47.80
```

## Sensor Positioning

### For Optimal Detection

1. **Align Sensors** - Both sensors should face the same direction
2. **Height Alignment** - Position at same height for consistent detection
3. **Clear Path** - Ensure nothing blocks the IR beams
4. **Distance** - Test range (typically 5-15 cm depending on sensor)
5. **Angle** - Position perpendicular to object path

### Layout Example
```
     ┌─── IR Sensor 1
     │
     ↓  (Object passes)
────────────────────────→ (direction of movement)
     ↑
     │
     └─── IR Sensor 2
     
   20 cm separation
```

## Troubleshooting

### LCD Not Showing Anything
1. Check I2C address (use I2C Scanner)
2. Verify connections: SDA, SCL, GND, VCC
3. Check contrast: some LCDs have contrast adjustment potentiometer

### Sensors Not Detecting Objects
1. Check if OUT pins are connected to pins 2 and 3
2. Test sensor with multimeter (should change state when object near)
3. Verify sensor is powered (look for LED indicator)
4. Increase sensor sensitivity if available

### Inaccurate Speed Readings
1. Verify distance_cm value matches actual sensor spacing
2. Ensure sensors are perpendicular to object motion
3. Test with objects of different sizes
4. Verify micros() timing (requires smooth object movement)

### Serial Data Not Appearing
1. Check baud rate is 9600
2. Verify USB cable is connected
3. Confirm Arduino is powered
4. Select correct COM port in Arduino IDE

## Advanced: Modifying Sensor Count

To use **more than 2 sensors** for detection zones:

1. Add more sensor inputs:
   ```cpp
   int sensor3 = 4;
   int sensor4 = 5;
   ```

2. Add more pins to setup():
   ```cpp
   pinMode(sensor3, INPUT);
   pinMode(sensor4, INPUT);
   ```

3. Adjust timing logic to track multiple zones

## Performance Notes

- **Micros() Precision**: Uses 1 microsecond resolution for timing
- **Maximum Speed**: ~4000 km/h theoretical limit (before overflow)
- **Minimum Speed**: ~0.00001 km/s (limited by distance and timing)
- **Object Detection**: Works with any opaque object blocking IR beam

## Power Considerations

### USB Powered (Recommended for Development)
- Connect Arduino via USB cable
- Provides 5V and 500mA
- Sufficient for Arduino + LCD + 2 IR sensors

### External Power Supply
If deploying away from computer:
- Use 5V DC power supply (1A minimum)
- Connect to Arduino power pins (5V and GND)
- Keeps system running continuously

## Field Testing

1. **Test Moving Objects**:
   - Roll a ball through the sensors
   - Walk an object past the sensors
   - Verify LCD shows speed readings

2. **Verify Data Output**:
   - Open Serial Monitor (Tools → Serial Monitor at 9600 baud)
   - Confirm you see CSV format output
   - Check text format matches expected calculations

3. **Document Results**:
   - Note actual sensor distance
   - Test multiple object speeds
   - Verify accuracy of speed calculations

## Session Tracking

Each time Arduino powers up or resets:
1. New **Session ID** is generated (based on boot milliseconds)
2. **Object Counter** resets to 0
3. First object detected increments to 1
4. Each subsequent object increments counter

Session ID format:
```
sessionId = (int)(millis() / 1000);
// Example: 45230 = system running for 45230 seconds
```

This allows tracking measurements across multiple test runs.

## Next Steps

1. ✅ Upload sketch and test hardware
2. ✅ Verify serial output in Arduino IDE
3. → Connect to Node.js backend OR Web Serial Viewer
4. → Monitor speed data in real-time
5. → Export data to CSV for analysis
