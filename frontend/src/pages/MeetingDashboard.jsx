import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MeetingDashboard.css';
import API_BASE_URL from '../config';

const MeetingDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/meetings`);
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    
    // Polling interval if any meeting is still processing
    const interval = setInterval(() => {
      const isProcessing = meetings.some(m => !m.summary);
      if (isProcessing || meetings.length === 0) {
        fetchMeetings();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [meetings]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!audioFile && !title) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (audioFile) {
        formData.append('audio', audioFile);
      }
      
      await axios.post(`${API_BASE_URL}/api/meetings/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setTitle('');
      setAudioFile(null);
      setShowUpload(false);
      fetchMeetings();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/meetings/${id}`);
      fetchMeetings();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>MEETING_INTELLIGENCE <span className="dim">// PROCESSING_v2.1</span></h1>
        <div className="header-actions">
          <button className="btn-cyber secondary" onClick={fetchMeetings}>REFRESH</button>
          <button className="btn-cyber" onClick={() => setShowUpload(true)}>+ NEW_RECORDING</button>
        </div>
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
              <div className="file-upload-section">
                <label className="cyber-label">SELECT AUDIO RECORDING</label>
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="cyber-input" 
                  onChange={(e) => setAudioFile(e.target.files[0])}
                />
              </div>
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
                <div className="actions">
                  <Link to={`/meetings/${m._id}`} className="btn-action">VIEW_DETAILS</Link>
                  <button className="btn-action delete" onClick={() => handleDelete(m._id)}>DELETE</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingDashboard;
