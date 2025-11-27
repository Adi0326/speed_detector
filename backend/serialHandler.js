const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { insertSpeedRecord } = require('./database');

let port = null;
let parser = null;
let isConnected = false;
let dataCallback = null;

async function connectToArduino(portName = 'COM3', baudRate = 9600) {
  return new Promise((resolve, reject) => {
    try {
      port = new SerialPort({
        path: portName,
        baudRate: baudRate
      });

      parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      port.on('open', () => {
        console.log(`Connected to Arduino on ${portName} at ${baudRate} baud`);
        isConnected = true;
        resolve(true);
      });

      port.on('error', (err) => {
        console.error('Serial port error:', err.message);
        isConnected = false;
        reject(err);
      });

      parser.on('data', async (data) => {
        try {
          await processSerialData(data);
        } catch (error) {
          console.error('Error processing serial data:', error);
        }
      });

      parser.on('error', (err) => {
        console.error('Parser error:', err.message);
      });
    } catch (error) {
      console.error('Error connecting to Arduino:', error.message);
      isConnected = false;
      reject(error);
    }
  });
}

async function processSerialData(rawData) {
  const data = rawData.trim();

  // Skip empty lines and non-data messages
  if (!data) {
    return;
  }

  // Skip initialization messages
  if (data.includes('Initialized') || data.includes('Session ID')) {
    console.log(`[Arduino]: ${data}`);
    return;
  }

  // Parse CSV format from Arduino: CSV:sessionId,objectNo,speed_km_h
  if (data.startsWith('CSV:')) {
    const csvData = data.substring(4);  // Remove "CSV:" prefix
    const parts = csvData.split(',');
    
    if (parts.length === 3) {
      const sessionId = parseInt(parts[0], 10);
      const objectNo = parseInt(parts[1], 10);
      const speed = parseFloat(parts[2]);

      if (!isNaN(sessionId) && !isNaN(objectNo) && !isNaN(speed)) {
        try {
          const record = await insertSpeedRecord(sessionId, objectNo, speed);
          console.log(`[Session ${sessionId}] Object #${objectNo} - Speed ${speed.toFixed(2)} km/h`);

          // Call data callback if set (for WebSocket broadcast)
          if (dataCallback) {
            dataCallback(record);
          }
        } catch (error) {
          console.error('Failed to save record:', error);
        }
      } else {
        console.warn('Invalid CSV data:', data);
      }
    } else {
      console.warn('Unexpected CSV format:', data);
    }
    return;
  }

  // Log other data for debugging
  console.log(`[Serial data]: ${data}`);
}

function setDataCallback(callback) {
  dataCallback = callback;
}

function isSerialConnected() {
  return isConnected && port && port.isOpen;
}

async function disconnectArduino() {
  return new Promise((resolve, reject) => {
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error('Error closing serial port:', err.message);
          reject(err);
        } else {
          console.log('Serial port closed');
          isConnected = false;
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  });
}

function getSerialPort() {
  return port;
}

module.exports = {
  connectToArduino,
  disconnectArduino,
  setDataCallback,
  isSerialConnected,
  getSerialPort
};
