class SpeedDetectorDashboard {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.records = [];
    this.statistics = null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isCleared = false;
    this.currentPage = 'dashboard';
    this.speedChart = null;
    this.sessionChart = null;

    this.elements = {
      loginPage: document.getElementById('loginPage'),
      dashboardPage: document.getElementById('dashboardPage'),
      loginForm: document.getElementById('loginForm'),
      username: document.getElementById('username'),
      password: document.getElementById('password'),
      loginError: document.getElementById('loginError'),
      logoutBtn: document.getElementById('logoutBtn'),
      tableBody: document.getElementById('tableBody'),
      totalRecords: document.getElementById('totalRecords'),
      currentSpeed: document.getElementById('currentSpeed'),
      avgSpeed: document.getElementById('avgSpeed'),
      maxSpeed: document.getElementById('maxSpeed'),
      statusBadge: document.getElementById('statusBadge'),
      lastUpdate: document.getElementById('lastUpdate'),
      refreshBtn: document.getElementById('refreshBtn'),
      exportBtn: document.getElementById('exportBtn'),
      deleteBtn: document.getElementById('deleteBtn'),
      selectAll: document.getElementById('selectAll'),
      selectionInfo: document.getElementById('selectionInfo'),
      selectedCount: document.getElementById('selectedCount'),
      navBtns: document.querySelectorAll('.nav-btn'),
      pages: document.querySelectorAll('.page'),
      statsTotal: document.getElementById('statsTotal'),
      statsAvg: document.getElementById('statsAvg'),
      statsMax: document.getElementById('statsMax'),
      statsMin: document.getElementById('statsMin'),
      sessionsBody: document.getElementById('sessionsBody'),
      speedChartCanvas: document.getElementById('speedChart'),
      sessionChartCanvas: document.getElementById('sessionChart')
    };
    
    this.selectedRecords = new Set();

    this.init();
  }

  async init() {
    if (this.token) {
      const isValid = await this.verifyToken();
      if (isValid) {
        this.showDashboard();
        this.setupDashboard();
      } else {
        this.logout();
      }
    } else {
      this.showLogin();
      this.setupLogin();
    }
  }

  setupLogin() {
    this.elements.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginBtn = this.elements.loginForm.querySelector('button');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      try {
        await this.handleLogin(e);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    });
  }

  async handleLogin(e) {
    const username = this.elements.username.value.trim();
    const password = this.elements.password.value.trim();

    if (!username || !password) {
      this.showLoginError('Username and password are required');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        this.elements.username.value = '';
        this.elements.password.value = '';
        this.elements.loginError.style.display = 'none';
        this.showDashboard();
        this.setupDashboard();
      } else {
        const error = await response.json().catch(() => ({}));
        this.showLoginError(error.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showLoginError('Login failed. Please try again.');
    }
  }

  showLoginError(message) {
    this.elements.loginError.textContent = message;
    this.elements.loginError.style.display = 'block';
  }

  async verifyToken() {
    try {
      const response = await fetch('/api/verify-token', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  showLogin() {
    this.elements.loginPage.style.display = 'flex';
    this.elements.dashboardPage.style.display = 'none';
  }

  showDashboard() {
    this.elements.loginPage.style.display = 'none';
    this.elements.dashboardPage.style.display = 'block';
  }

  async setupDashboard() {
    try {
      await this.loadInitialData();
      this.setupWebSocket();
      this.setupEventListeners();
      setInterval(() => this.refreshData(), 5000);
      setInterval(() => this.updateTimestamp(), 1000);
    } catch (error) {
      console.error('Error setting up dashboard:', error);
      this.logout();
    }
  }

  setupEventListeners() {
    this.elements.refreshBtn.addEventListener('click', () => this.manualRefresh());
    this.elements.exportBtn.addEventListener('click', () => this.exportCSV());
    this.elements.deleteBtn.addEventListener('click', () => this.deleteSelected());
    this.elements.selectAll.addEventListener('change', (e) => this.selectAllRecords(e.target.checked));
    this.elements.logoutBtn.addEventListener('click', () => this.logout());

    this.elements.navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
    });
  }

  switchPage(pageName) {
    this.currentPage = pageName;

    this.elements.pages.forEach(page => {
      page.classList.remove('active');
    });

    this.elements.navBtns.forEach(btn => {
      btn.classList.remove('active');
    });

    document.getElementById(pageName).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'statistics') {
      setTimeout(() => this.loadStatistics(), 100);
    }
  }

  async loadInitialData() {
    try {
      const response = await fetch('/api/records', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (response.ok) {
        this.records = await response.json();
        this.updateDisplay();
      } else if (response.status === 401) {
        this.logout();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.updateConnectionStatus(true);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'newRecord') {
            this.addNewRecord(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateConnectionStatus(false);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.updateConnectionStatus(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.updateConnectionStatus(false);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.setupWebSocket(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  addNewRecord(record) {
    this.isCleared = false;
    const normalizedRecord = {
      id: record.id || Date.now(),
      sessionId: record.sessionId,
      objectNo: record.objectNo,
      speed: record.speed_km_h !== undefined ? record.speed_km_h : record.speed,
      date: record.date || new Date().toLocaleDateString('en-GB'),
      time: record.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
      timestamp: record.timestamp
    };
    this.records.push(normalizedRecord);
    if (this.records.length > 1000) {
      this.records = this.records.slice(-1000);
    }
    if (this.currentPage === 'dashboard') {
      this.updateDisplay();
    }
  }

  async refreshData() {
    if (this.isCleared) return;

    try {
      const response = await fetch('/api/records', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (response.ok) {
        const freshRecords = await response.json();
        if (freshRecords.length > 0 && freshRecords.length !== this.records.length) {
          this.records = freshRecords;
          if (this.currentPage === 'dashboard') {
            this.updateDisplay();
          }
        }
      } else if (response.status === 401) {
        this.logout();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  async loadStatistics() {
    try {
      const response = await fetch('/api/statistics', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (response.ok) {
        this.statistics = await response.json();
        this.updateStatisticsDisplay();
      } else if (response.status === 401) {
        this.logout();
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  updateStatisticsDisplay() {
    if (!this.statistics) return;

    this.elements.statsTotal.textContent = this.statistics.totalRecords;
    this.elements.statsAvg.textContent = this.statistics.averageSpeed !== 0 ? `${this.statistics.averageSpeed} km/h` : '-- km/h';
    this.elements.statsMax.textContent = this.statistics.maxSpeed !== 0 ? `${this.statistics.maxSpeed} km/h` : '-- km/h';
    this.elements.statsMin.textContent = this.statistics.minSpeed !== 0 ? `${this.statistics.minSpeed} km/h` : '-- km/h';

    this.updateSessionsTable();
    this.updateCharts();
  }

  updateSessionsTable() {
    if (!this.statistics || Object.keys(this.statistics.sessions).length === 0) {
      this.elements.sessionsBody.innerHTML = '<tr class="empty-row"><td colspan="4">No session data available</td></tr>';
      return;
    }

    const sessions = Object.values(this.statistics.sessions);
    this.elements.sessionsBody.innerHTML = sessions
      .map(session => `
        <tr>
          <td>${session.sessionId}</td>
          <td>${session.count}</td>
          <td>${session.avgSpeed} km/h</td>
          <td>${session.maxSpeed} km/h</td>
        </tr>
      `)
      .join('');
  }

  updateCharts() {
    const speeds = this.records.map(r => parseFloat(r.speed)).slice(0, 50);

    if (speeds.length === 0) return;

    this.updateSpeedChart(speeds);
    this.updateSessionChart();
  }

  updateSpeedChart(speeds) {
    const ctx = this.elements.speedChartCanvas.getContext('2d');

    if (this.speedChart) {
      this.speedChart.destroy();
    }

    this.speedChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: speeds.map((_, i) => `Record ${i + 1}`),
        datasets: [{
          label: 'Speed (km/h)',
          data: speeds,
          borderColor: '#00d9ff',
          backgroundColor: 'rgba(0, 217, 255, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff006e',
          pointBorderColor: '#00d9ff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: '#e0e6ff'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9099b7'
            },
            grid: {
              color: 'rgba(42, 53, 80, 0.5)'
            }
          },
          x: {
            ticks: {
              color: '#9099b7'
            },
            grid: {
              color: 'rgba(42, 53, 80, 0.5)'
            }
          }
        }
      }
    });
  }

  updateSessionChart() {
    if (!this.statistics) return;

    const sessions = Object.values(this.statistics.sessions);
    const ctx = this.elements.sessionChartCanvas.getContext('2d');

    if (this.sessionChart) {
      this.sessionChart.destroy();
    }

    this.sessionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sessions.map(s => `Session ${s.sessionId}`),
        datasets: [{
          label: 'Avg Speed (km/h)',
          data: sessions.map(s => parseFloat(s.avgSpeed)),
          backgroundColor: '#00d9ff',
          borderColor: '#00d9ff',
          borderWidth: 2
        }, {
          label: 'Max Speed (km/h)',
          data: sessions.map(s => parseFloat(s.maxSpeed)),
          backgroundColor: '#ff006e',
          borderColor: '#ff006e',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: '#e0e6ff'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9099b7'
            },
            grid: {
              color: 'rgba(42, 53, 80, 0.5)'
            }
          },
          x: {
            ticks: {
              color: '#9099b7'
            },
            grid: {
              color: 'rgba(42, 53, 80, 0.5)'
            }
          }
        }
      }
    });
  }

  async manualRefresh() {
    const btn = this.elements.refreshBtn;
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      const response = await fetch('/api/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (response.ok) {
        const result = await response.json();
        this.records = [];
        this.isCleared = true;
        this.updateDisplay();
        console.log(`Database cleared. Deleted ${result.deleted} records.`);
      } else if (response.status === 401) {
        this.logout();
      }
    } catch (error) {
      console.error('Error clearing database:', error);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }

  exportCSV() {
    const btn = this.elements.exportBtn;
    btn.disabled = true;

    try {
      window.location.href = '/api/export/excel?token=' + encodeURIComponent(this.token);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setTimeout(() => {
        btn.disabled = false;
      }, 1000);
    }
  }

  updateDisplay() {
    this.updateTable();
    this.updateStats();
    this.updateTimestamp();
  }

  updateTable() {
    const tableBody = this.elements.tableBody;

    if (this.records.length === 0) {
      tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">No data yet. Waiting for Arduino data...</td></tr>';
      return;
    }

    tableBody.innerHTML = this.records
      .slice(0, 50)
      .map(
        (record, index) => {
          const speed = parseFloat(record.speed);
          const speedText = isNaN(speed) ? '-- km/h' : `${speed.toFixed(2)} km/h`;
          return `
      <tr class="${index === 0 ? 'new-row' : ''}" data-record-id="${record.id}">
        <td style="text-align: center;"><input type="checkbox" class="record-checkbox" value="${record.id}"></td>
        <td>${record.sessionId || '-'}</td>
        <td>${record.objectNo || '-'}</td>
        <td>${speedText}</td>
        <td>${record.date || '--'}</td>
        <td>${record.time || '--'}</td>
      </tr>
    `;
        }
      )
      .join('');

    this.attachCheckboxListeners();
  }

  attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.record-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateSelection());
    });
  }

  updateSelection() {
    const checkboxes = document.querySelectorAll('.record-checkbox:checked');
    this.selectedRecords.clear();
    
    checkboxes.forEach(checkbox => {
      this.selectedRecords.add(parseInt(checkbox.value));
    });

    const count = this.selectedRecords.size;
    if (count > 0) {
      this.elements.deleteBtn.style.display = 'inline-block';
      this.elements.selectionInfo.style.display = 'block';
      this.elements.selectedCount.textContent = count;
      this.elements.selectAll.checked = count === document.querySelectorAll('.record-checkbox').length;
    } else {
      this.elements.deleteBtn.style.display = 'none';
      this.elements.selectionInfo.style.display = 'none';
      this.elements.selectAll.checked = false;
    }
  }

  selectAllRecords(selectAll) {
    const checkboxes = document.querySelectorAll('.record-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAll;
    });
    this.updateSelection();
  }

  async deleteSelected() {
    if (this.selectedRecords.size === 0) {
      alert('Please select records to delete');
      return;
    }

    const confirmed = confirm(`Delete ${this.selectedRecords.size} record(s)? This action cannot be undone.`);
    if (!confirmed) return;

    const btn = this.elements.deleteBtn;
    btn.disabled = true;

    try {
      const response = await fetch('/api/delete-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ recordIds: Array.from(this.selectedRecords) })
      });

      if (response.ok) {
        const result = await response.json();
        this.records = this.records.filter(r => !this.selectedRecords.has(r.id));
        this.selectedRecords.clear();
        this.updateTable();
        this.updateStats();
        this.elements.deleteBtn.style.display = 'none';
        this.elements.selectionInfo.style.display = 'none';
        console.log(`${result.deleted} record(s) deleted successfully`);
      } else if (response.status === 401) {
        this.logout();
      } else {
        const result = await response.json();
        alert('Failed to delete records: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Error deleting records');
    } finally {
      btn.disabled = false;
    }
  }

  updateStats() {
    const totalRecords = this.records.length;
    const speeds = this.records.map((r) => parseFloat(r.speed)).filter(s => !isNaN(s));

    this.elements.totalRecords.textContent = totalRecords;

    if (speeds.length > 0) {
      const currentSpeed = speeds[speeds.length - 1];
      const avgSpeed = (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
      const maxSpeed = Math.max(...speeds).toFixed(2);

      this.elements.currentSpeed.textContent = `${currentSpeed.toFixed(2)} km/h`;
      this.elements.avgSpeed.textContent = `${avgSpeed} km/h`;
      this.elements.maxSpeed.textContent = `${maxSpeed} km/h`;
    } else {
      this.elements.currentSpeed.textContent = '-- km/h';
      this.elements.avgSpeed.textContent = '-- km/h';
      this.elements.maxSpeed.textContent = '-- km/h';
    }
  }

  updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
    this.elements.lastUpdate.textContent = timeString;
  }

  updateConnectionStatus(isConnected) {
    const badge = this.elements.statusBadge;
    if (isConnected) {
      badge.textContent = '✓ Connected';
      badge.className = 'status-badge connected';
    } else {
      badge.textContent = '✗ Disconnected';
      badge.className = 'status-badge disconnected';
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    this.token = null;
    if (this.ws) {
      this.ws.close();
    }
    this.elements.username.value = '';
    this.elements.password.value = '';
    this.elements.loginError.style.display = 'none';
    this.showLogin();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SpeedDetectorDashboard();
});
