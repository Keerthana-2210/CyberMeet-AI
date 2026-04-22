import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSecurity } from '../context/SecurityContext';
import './Dashboard.css';
import API_BASE_URL from '../config';

const Dashboard = () => {
  const { alerts, fetchAlerts } = useSecurity();
  const [scanContent, setScanContent] = useState('');
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanContent.trim()) return;
    setScanning(true);
    try {
      await axios.post(`${API_BASE_URL}/api/alerts/analyze`, { content: scanContent, source: 'Manual Scan' });
      setScanContent('');
      fetchAlerts();
    } catch (err) {
      console.error('Scan failed:', err);
    }
    setScanning(false);
  };

  const createTicket = async (alert) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/alerts/${alert._id}/ticket`);
      // Pass the entire alert data to the resolution dashboard
      navigate(`/soc/resolution/${alert._id}`, { state: { alert } });
      fetchAlerts();
    } catch (err) {
      console.error('Ticket creation failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this incident?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filter out Resolved alerts for the active view
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved');
  
  const stats = activeAlerts.reduce((acc, curr) => {
    const sev = curr.severity.toLowerCase();
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  return (
    <div className="dashboard-container">
      <header className="soc-header">
        <div className="logo-section">
          <span className="blink">●</span>
          <h1>CYBERGUARD <span className="dim">// SOC-CENTER_V1.0</span></h1>
        </div>
        <div className="status-bar">
          SYSTEM STATUS: <span className="online">ONLINE</span> | UPTIME: <span className="dim">99.99%</span>
        </div>
      </header>

      <div className="stats-row">
        <div className="cyber-panel stat-box critical">
          <label>CRITICAL THREATS</label>
          <div className="value">{stats.high}</div>
        </div>
        <div className="cyber-panel stat-box warning">
          <label>SUSPICIOUS EVENTS</label>
          <div className="value">{stats.medium}</div>
        </div>
        <div className="cyber-panel stat-box info">
          <label>LOW RISK LOGS</label>
          <div className="value">{stats.low}</div>
        </div>
      </div>

      <div className="main-grid">
        <section className="cyber-panel tool-panel">
          <h2>QUICK SCAN TOOL</h2>
          <p className="description">Input suspicious messages or logs for AI analysis.</p>
          <form onSubmit={handleScan}>
            <textarea 
              placeholder="Paste content here..." 
              value={scanContent}
              onChange={(e) => setScanContent(e.target.value)}
              className="cyber-input"
            />
            <button type="submit" className="btn-cyber block" disabled={scanning}>
              {scanning ? 'SCANNING...' : 'EXECUTE ANALYSIS'}
            </button>
          </form>
        </section>

        <section className="cyber-panel list-panel">
          <div className="list-header">
            <h2>ACTIVE INCIDENTS</h2>
            <button className="btn-refresh" onClick={fetchAlerts}>REFRESH</button>
          </div>
          <div className="alerts-list">
            {activeAlerts.length === 0 ? (
              <div className="empty-list">No active incidents detected. Monitoring system active.</div>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert._id} className="alert-item">
                  <div className="alert-top">
                    <span className={`badge ${alert.severity.toLowerCase() === 'high' ? 'critical' : alert.severity.toLowerCase() === 'medium' ? 'warning' : 'info'}`}>
                      {alert.type}
                    </span>
                    <span className="timestamp">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="alert-body">
                    <p>{alert.description}</p>
                    <span className="source-text">Source: {alert.source}</span>
                  </div>
                  <div className="alert-footer">
                    <span className={`status-text ${alert.status === 'Open' ? 'open' : 'in-progress'}`}>{alert.status}</span>
                    <div className="actions">
                      {!alert.ticketCreated ? (
                        <button className="btn-action" onClick={() => createTicket(alert)}>INITIATE TICKET</button>
                      ) : (
                        <button className="btn-action" onClick={() => navigate(`/soc/resolution/${alert._id}`, { state: { alert } })}>VIEW TICKET</button>
                      )}
                      <button className="btn-action delete" onClick={() => handleDelete(alert._id)}>DELETE</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
