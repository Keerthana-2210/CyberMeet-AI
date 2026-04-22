import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSecurity } from '../context/SecurityContext';
import './IncidentResolution.css';

const IncidentResolution = () => {
    const { state } = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { alerts, updateAlertStatus } = useSecurity();
    
    // Fallback if state is missing (e.g. direct refresh)
    const alert = state?.alert || alerts.find(a => a._id === id);
    
    const [resolving, setResolving] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [analysisDone, setAnalysisDone] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState([]);
    
    useEffect(() => {
        if (!alert) {
            // If still no alert, fetch or redirect
            // For now, redirect to soc
            setTimeout(() => {
                if (!alert) navigate('/soc');
            }, 1000);
        }
    }, [alert, navigate]);

    const runAiAnalysis = () => {
        setAiAnalyzing(true);
        setAnalysisDone(false);
        setTimeout(() => {
            setAiAnalyzing(false);
            setAnalysisDone(true);
            setSuggestedActions([
                { id: 'block', text: 'Block Sender Source IP', risk: 'Low' },
                { id: 'safe', text: 'Mark as Safe (Internal)', risk: 'Medium' },
                { id: 'alert', text: 'Alert Security Team', risk: 'Low' },
                { id: 'quarantine', text: 'Quarantine Payload', risk: 'Low' }
            ]);
        }, 2000);
    };

    const handleAction = async (statusOverride) => {
        setResolving(true);
        const targetStatus = statusOverride || 'Resolved';
        const success = await updateAlertStatus(alert._id, targetStatus);
        if (success) {
            setTimeout(() => {
                navigate('/soc');
            }, 1500);
        } else {
            setResolving(false);
        }
    };

    if (!alert) return <div className="loading-screen">LOCATING INCIDENT DATA...</div>;

    const isCritical = alert.severity.toLowerCase() === 'high';

    return (
        <div className="resolution-page">
            <header className="resolution-header">
                <button className="btn-back-main" onClick={() => navigate('/soc')}>← BACK_TO_DASHBOARD</button>
                <div className="page-title">
                    <span className="breadcrumb">SOC / INCIDENT_RESOLUTION</span>
                    <h1>INCIDENT_RESOLUTION_HUB <span className="dim">// ID_{alert._id}</span></h1>
                </div>
                <div className="workflow-status">
                    <div className={`step ${alert.status === 'Open' ? 'active' : 'done'}`}>DETECTED</div>
                    <div className="arrow">→</div>
                    <div className={`step ${alert.status === 'In Progress' ? 'active' : ''}`}>IN_PROGRESS</div>
                    <div className="arrow">→</div>
                    <div className={`step ${alert.status === 'Resolved' ? 'active' : ''}`}>RESOLVED</div>
                </div>
            </header>

            <div className="resolution-grid">
                {/* Section 1: Full Details */}
                <section className="cyber-panel details-section">
                    <div className="panel-header">
                        <span className="icon">📄</span>
                        <h3>INCIDENT_DETAILS</h3>
                    </div>
                    <div className="details-content">
                        <div className="detail-row">
                            <label>TYPE:</label>
                            <span className={`value badge ${isCritical ? 'critical' : 'warning'}`}>{alert.type}</span>
                        </div>
                        <div className="detail-row">
                            <label>TIMESTAMP:</label>
                            <span className="value">{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="detail-row">
                            <label>SOURCE:</label>
                            <span className="value cyan-text">{alert.source}</span>
                        </div>
                        <div className="detail-block">
                            <label>DESCRIPTION:</label>
                            <p>{alert.description}</p>
                        </div>
                        <div className="detail-block">
                            <label>DETECTED_KEYWORDS:</label>
                            <div className="keyword-tags">
                                {alert.description.split(' ').filter(w => w.length > 4).slice(0, 5).map((w, i) => (
                                    <span key={i} className="k-tag">{w.replace(/[^a-zA-Z]/g, '').toUpperCase()}</span>
                                ))}
                                <span className="k-tag high-risk">PHISH_SIG</span>
                                <span className="k-tag high-risk">MAL_PATTERN</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: AI Resolution Tools */}
                <section className="cyber-panel ai-section">
                    <div className="panel-header">
                        <span className="icon">🤖</span>
                        <h3>AI_RESOLUTION_CORE</h3>
                        <span className="engine-v">ENGINE_v4.2</span>
                    </div>
                    
                    {!analysisDone && !aiAnalyzing && (
                        <div className="ai-start">
                            <p>Threat detected. AI analysis is required for suggested mitigation.</p>
                            <button className="btn-cyber block primary" onClick={runAiAnalysis}>INITIALIZE_AI_SCAN</button>
                        </div>
                    )}

                    {aiAnalyzing && (
                        <div className="ai-analyzing">
                            <div className="spinner"></div>
                            <p>DECONSTRUCTING_PACKETS...</p>
                            <div className="progress-bar-small">
                                <div className="fill-anim"></div>
                            </div>
                        </div>
                    )}

                    {analysisDone && (
                        <div className="ai-results">
                            <div className="analysis-summary">
                                <strong>ANALYSIS_COMPLETE:</strong>
                                <p>Pattern matches found in 3 global threat databases. High correlation with known phishing campaigns targeting regional financial sectors.</p>
                            </div>
                            
                            <h4>SUGGESTED_MITIGATIONS:</h4>
                            <div className="suggestion-list">
                                {suggestedActions.map(action => (
                                    <div key={action.id} className="suggestion-item">
                                        <div className="s-info">
                                            <span className="s-text">{action.text}</span>
                                            <span className="s-risk">RISK: {action.risk}</span>
                                        </div>
                                        <button className="btn-s-action">APPLY</button>
                                    </div>
                                ))}
                            </div>

                            <button className="btn-cyber block auto-resolve" onClick={() => handleAction()}>
                                {resolving ? 'MITIGATING...' : 'EXECUTE_AUTO_RESOLVE'}
                            </button>
                        </div>
                    )}
                </section>

                {/* Section 3: Final Controls */}
                <section className="cyber-panel control-section">
                    <div className="panel-header">
                        <span className="icon">⚖️</span>
                        <h3>RESOLUTION_CONTROLS</h3>
                    </div>
                    <div className="action-grid">
                        <button className="btn-action-hub resolve" onClick={() => handleAction('Resolved')}>
                            <span className="btn-icon">✅</span>
                            <span className="btn-text">RESOLVE_ISSUE</span>
                        </button>
                        <button className="btn-action-hub false-positive" onClick={() => handleAction('Resolved')}>
                            <span className="btn-icon">🔍</span>
                            <span className="btn-text">MARK_FALSE_POSITIVE</span>
                        </button>
                        <button className="btn-action-hub escalate" onClick={() => {}}>
                            <span className="btn-icon">⚠️</span>
                            <span className="btn-text">ESCALATE_THREAT</span>
                        </button>
                        <button className="btn-action-hub back" onClick={() => navigate('/soc')}>
                            <span className="btn-icon">🏠</span>
                            <span className="btn-text">BACK_TO_DASHBOARD</span>
                        </button>
                    </div>
                    
                    {resolving && (
                        <div className="resolution-overlay">
                            <div className="overlay-content">
                                <h3>SYNCHRONIZING_STATUS...</h3>
                                <div className="progress-bar-large">
                                    <div className="fill-anim-large"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default IncidentResolution;
