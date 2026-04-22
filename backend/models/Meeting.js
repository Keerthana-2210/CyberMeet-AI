const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/meetings.json');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

class Meeting {
  static async find() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const meetings = JSON.parse(data);
    return meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  static async findById(id) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const meetings = JSON.parse(data);
    return meetings.find(m => m._id === id);
  }

  constructor(data) {
    this._id = Date.now().toString();
    this.title = data.title;
    this.date = data.date || new Date();
    this.duration = data.duration;
    this.audioUrl = data.audioUrl;
    this.transcript = data.transcript;
    this.summary = data.summary;
    this.sentiment = data.sentiment;
    this.sentimentScore = data.sentimentScore;
    this.actionItems = data.actionItems || [];
    this.executionPlan = data.executionPlan || [];
    this.createdAt = new Date();
  }

  async save() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const meetings = JSON.parse(data);
    const index = meetings.findIndex(m => m._id === this._id);
    
    if (index !== -1) {
      meetings[index] = this;
    } else {
      meetings.push(this);
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(meetings, null, 2));
    return this;
  }

  static async findByIdAndUpdate(id, update) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const meetings = JSON.parse(data);
    const index = meetings.findIndex(m => m._id === id);
    if (index === -1) return null;
    
    meetings[index] = { ...meetings[index], ...update };
    fs.writeFileSync(DB_PATH, JSON.stringify(meetings, null, 2));
    return meetings[index];
  }

  static async findByIdAndRemove(id) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const meetings = JSON.parse(data);
    const filtered = meetings.filter(m => m._id !== id);
    if (meetings.length === filtered.length) return null;
    fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2));
    return true;
  }
}

module.exports = Meeting;
