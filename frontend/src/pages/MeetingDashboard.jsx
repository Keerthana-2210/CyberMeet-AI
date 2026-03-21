import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MeetingDashboard.css';

const MeetingDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/meetings');
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      // Simulating audio file since we don't have one
      await axios.post('http://localhost:5001/api/meetings/upload', formData);
      setTitle('');
      setShowUpload(false);
      fetchMeetings();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>MEETING_INTELLIGENCE <span className="dim">// PROCESSING_v2.1</span></h1>
        <button className="btn-cyber" onClick={() => setShowUpload(true)}>+ NEW_RECORDING</button>
      </header>

      {showUpload && (
        <div className="cyber-modal">
          <div className="cyber-panel modal-content">
            <h3>INITIALIZE SESSION</h3>
            <form onSubmit={handleUpload}>
              <input 
                type="text" 
                placeholder="SESSION_TITLE" 
                className="cyber-input" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="btn-cyber" disabled={uploading}>
                  {uploading ? 'UPLOADING...' : 'START_ANALYSIS'}
                </button>
                <button type="button" className="btn-cyber secondary" onClick={() => setShowUpload(false)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="meetings-grid">
        {meetings.length === 0 ? (
          <div className="cyber-panel empty-state">NO SESSION DATA FOUND. SYSTEM READY FOR UPLOAD.</div>
        ) : (
          meetings.map(m => (
            <div key={m._id} className="cyber-panel meeting-card">
              <div className="card-top">
                <span className="date">{new Date(m.date).toLocaleDateString()}</span>
                <span className={`badge ${m.sentiment?.toLowerCase() === 'positive' ? 'info' : 'warning'}`}>
                  {m.sentiment || 'PROCESSING'}
                </span>
              </div>
              <h3>{m.title}</h3>
              <p className="summary-preview">{m.summary || 'AI Analysis in progress...'}</p>
              <div className="card-footer">
                <span className="task-count">{m.actionItems?.length || 0} TASKS</span>
                <button className="btn-action">VIEW_DETAILS</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingDashboard;
