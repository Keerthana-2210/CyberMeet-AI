import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MeetingDashboard from './pages/MeetingDashboard';
import MeetingDetail from './pages/MeetingDetail';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="grid-bg"></div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/soc" element={<Dashboard />} />
            <Route path="/meetings" element={<MeetingDashboard />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
