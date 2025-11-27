const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'speed_detector.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(
    `CREATE TABLE IF NOT EXISTS speed_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER DEFAULT 0,
      objectNo INTEGER NOT NULL,
      speed REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Database table initialized');
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating admin_users table:', err.message);
      } else {
        console.log('Admin users table initialized');
        initializeDefaultAdmin();
      }
    }
  );
}

function initializeDefaultAdmin() {
  const crypto = require('crypto');
  const defaultUsername = 'admin';
  const defaultPassword = 'admin123';
  
  const hashedPassword = crypto
    .createHash('sha256')
    .update(defaultPassword)
    .digest('hex');

  db.run(
    `INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)`,
    [defaultUsername, hashedPassword],
    (err) => {
      if (err) {
        console.error('Error initializing default admin:', err.message);
      } else {
        console.log('Default admin user initialized (username: admin, password: admin123)');
      }
    }
  );
}

function insertSpeedRecord(sessionId, objectNo, speed) {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB');
  const time = now.toLocaleTimeString('en-GB', { hour12: false });

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO speed_records (sessionId, objectNo, speed, date, time) VALUES (?, ?, ?, ?, ?)',
      [sessionId, objectNo, speed, date, time],
      function (err) {
        if (err) {
          console.error('Error inserting record:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, sessionId, objectNo, speed, date, time });
        }
      }
    );
  });
}

function getAllRecords() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, sessionId, objectNo, speed, date, time FROM speed_records ORDER BY id ASC LIMIT 100',
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

function getRecentRecords(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, sessionId, objectNo, speed, date, time FROM speed_records 
       ORDER BY timestamp ASC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

function clearOldRecords(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM speed_records WHERE timestamp < ?`,
      [cutoffDate.toISOString()],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function clearAllRecords() {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM speed_records`,
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function deleteRecordById(recordId) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM speed_records WHERE id = ?`,
      [recordId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function deleteRecordsByIds(recordIds) {
  return new Promise((resolve, reject) => {
    if (!recordIds || recordIds.length === 0) {
      resolve(0);
      return;
    }
    
    const placeholders = recordIds.map(() => '?').join(',');
    db.run(
      `DELETE FROM speed_records WHERE id IN (${placeholders})`,
      recordIds,
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function getStatistics() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT sessionId, objectNo, speed, date, time FROM speed_records ORDER BY id ASC`,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const stats = {
            totalRecords: rows.length,
            averageSpeed: 0,
            maxSpeed: 0,
            minSpeed: 0,
            sessions: {}
          };

          if (rows.length > 0) {
            const speeds = rows.map(r => parseFloat(r.speed));
            stats.averageSpeed = (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
            stats.maxSpeed = Math.max(...speeds).toFixed(2);
            stats.minSpeed = Math.min(...speeds).toFixed(2);

            rows.forEach(row => {
              if (!stats.sessions[row.sessionId]) {
                stats.sessions[row.sessionId] = {
                  sessionId: row.sessionId,
                  count: 0,
                  avgSpeed: 0,
                  maxSpeed: 0,
                  speeds: []
                };
              }
              stats.sessions[row.sessionId].speeds.push(parseFloat(row.speed));
            });

            Object.keys(stats.sessions).forEach(sid => {
              const speeds = stats.sessions[sid].speeds;
              stats.sessions[sid].count = speeds.length;
              stats.sessions[sid].avgSpeed = (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
              stats.sessions[sid].maxSpeed = Math.max(...speeds).toFixed(2);
              delete stats.sessions[sid].speeds;
            });
          }

          resolve(stats);
        }
      }
    );
  });
}

function getAdminByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, password FROM admin_users WHERE username = ?`,
      [username],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

module.exports = {
  db,
  insertSpeedRecord,
  getAllRecords,
  getRecentRecords,
  clearOldRecords,
  clearAllRecords,
  deleteRecordById,
  deleteRecordsByIds,
  getStatistics,
  getAdminByUsername,
  closeDatabase
};
