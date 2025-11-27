#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

// IR sensor pins
int sensor1 = 2;
int sensor2 = 3;

// Time variables
unsigned long t1 = 0;
unsigned long t2 = 0;
float distance_cm = 20.0;    // fixed distance between sensors

// Session tracking
int sessionId = 0;
int objectCount = 0;

void setup() {
  Serial.begin(9600);
  pinMode(sensor1, INPUT);
  pinMode(sensor2, INPUT);
  
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Speed Detector");
  lcd.setCursor(0, 1);
  lcd.print("Session Init...");
  delay(2000);
  
  // Initialize session (can be timestamp or counter)
  sessionId = (int)(millis() / 1000);  // Use seconds since boot as session ID
  objectCount = 0;
  
  Serial.println("=== Speed Detector Started ===");
  Serial.print("Session ID: ");
  Serial.println(sessionId);
  
  lcd.clear();
}

void loop() {
  // Wait for object to pass sensor 1
  lcd.setCursor(0, 0);
  lcd.print("Waiting IN     ");
  while (digitalRead(sensor1) == HIGH);   // LOW = object detected
  t1 = micros();
  
  // Wait for object to reach sensor 2
  lcd.setCursor(0, 0);
  lcd.print("Waiting OUT    ");
  while (digitalRead(sensor2) == HIGH);
  t2 = micros();
  
  unsigned long time_diff = t2 - t1;
  float time_sec = time_diff / 1000000.0;
  
  // Speed calculations
  float speed_cm_s = distance_cm / time_sec;     // cm per sec
  float speed_m_s  = speed_cm_s / 100.0;         // m per sec
  float speed_km_s = speed_m_s / 1000.0;         // km per sec
  float speed_km_h = speed_km_s * 3600.0;        // km per hour
  
  // Increment object counter for this session
  objectCount++;
  
  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Obj:");
  lcd.print(objectCount);
  lcd.print(" Spd:");
  lcd.print(speed_km_h, 1);
  lcd.setCursor(0, 1);
  lcd.print("km/h S");
  lcd.print(sessionId);
  
  // Send simple CSV format (for Node.js backend parsing)
  Serial.print("CSV:");
  Serial.print(sessionId);
  Serial.print(",");
  Serial.print(objectCount);
  Serial.print(",");
  Serial.print(speed_km_h, 2);
  Serial.println();
  
  delay(2000);
  lcd.clear();
}
[[]]