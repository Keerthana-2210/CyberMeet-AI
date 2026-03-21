const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/alerts.json');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

class Alert {
  static async find() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async findById(id) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data).find(a => a._id === id);
  }

  constructor(data) {
    this._id = Date.now().toString();
    this.type = data.type; // Phishing, Unauthorized access, Malware, etc.
    this.severity = data.severity; // High, Medium, Low
    this.description = data.description;
    this.source = data.source;
    this.status = data.status || 'Open';
    this.timestamp = new Date();
    this.ticketCreated = false;
  }

  async save() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const alerts = JSON.parse(data);
    alerts.push(this);
    fs.writeFileSync(DB_PATH, JSON.stringify(alerts, null, 2));
    return this;
  }

  static async findByIdAndUpdate(id, update) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const alerts = JSON.parse(data);
    const index = alerts.findIndex(a => a._id === id);
    if (index === -1) return null;
    
    alerts[index] = { ...alerts[index], ...update };
    fs.writeFileSync(DB_PATH, JSON.stringify(alerts, null, 2));
    return alerts[index];
  }
}

module.exports = Alert;
