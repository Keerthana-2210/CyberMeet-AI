import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './TaskExecutionSection.css';

const TaskExecutionSection = ({ meeting, fetchMeeting }) => {
    const [updating, setUpdating] = useState(false);
    const [toasts, setToasts] = useState([]);
    const executionPlan = meeting.executionPlan || [];

    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const updateExecutionPlan = async (newPlan) => {
        setUpdating(true);
        try {
            await axios.patch(`${API_BASE_URL}/api/meetings/${meeting._id}/update-execution`, {
                executionPlan: newPlan
            });
            await fetchMeeting(); // Refresh parent data
        } catch (error) {
            console.error("Failed to update execution plan:", error);
            showToast("Failed to update task status", "error");
        }
        setUpdating(false);
    };

    const toggleSubtask = (taskIndex, subtaskIndex) => {
        const newPlan = [...executionPlan];
        const subtask = newPlan[taskIndex].subtasks[subtaskIndex];
        subtask.completed = !subtask.completed;
        
        // Check overall task completion
        const allCompleted = newPlan[taskIndex].subtasks.every(st => st.completed);
        const noneCompleted = newPlan[taskIndex].subtasks.every(st => !st.completed);
        
        if (allCompleted) {
            newPlan[taskIndex].status = 'Completed';
            showToast(`Task "${newPlan[taskIndex].taskName}" marked as Complete!`, 'success');
        } else if (noneCompleted) {
            newPlan[taskIndex].status = 'Pending';
        } else {
            newPlan[taskIndex].status = 'In Progress';
        }
        
        updateExecutionPlan(newPlan);
    };

    const markTaskStatus = (taskIndex, status) => {
        const newPlan = [...executionPlan];
        newPlan[taskIndex].status = status;
        
        if (status === 'In Progress') {
            showToast(`Notification sent to ${newPlan[taskIndex].assignedPerson || 'Team'}: Task Started`, 'info');
        } else if (status === 'Completed') {
            // Mark all subtasks complete
            newPlan[taskIndex].subtasks.forEach(st => st.completed = true);
            showToast(`Task "${newPlan[taskIndex].taskName}" completed! stakeholders notified.`, 'success');
        }

        updateExecutionPlan(newPlan);
    };

    const getProgress = (task) => {
        if (!task.subtasks || task.subtasks.length === 0) return task.status === 'Completed' ? 100 : 0;
        const completed = task.subtasks.filter(st => st.completed).length;
        return Math.round((completed / task.subtasks.length) * 100);
    };

    const simulateReminder = (task) => {
        showToast(`[Slack] Reminder sent to ${task.assignedPerson || 'assignee'} regarding ${task.taskName}`, 'reminder');
    };

    if (!executionPlan || executionPlan.length === 0) {
        return (
            <section className="cyber-panel execution-section">
                <div className="section-header">
                    <h2>AI TASK EXECUTION PLAN</h2>
                </div>
                <p className="dim-text">No execution plan generated for this meeting. Please process with an updated AI model.</p>
            </section>
        );
    }

    return (
        <section className="cyber-panel execution-section">
            <div className="section-header">
                <h2>AI TASK EXECUTION PLAN</h2>
                {updating && <span className="updating-indicator">SYNCING_WITH_NEXUS...</span>}
            </div>

            <div className="tasks-container">
                {executionPlan.map((task, tIndex) => {
                    const progress = getProgress(task);
                    const isCritical = task.priority?.toLowerCase() === 'high';
                    const isHighRisk = task.risk?.toLowerCase().includes('high risk') || task.risk?.toLowerCase().includes('delayed');
                    
                    return (
                        <div key={tIndex} className={`exec-task-card ${task.status === 'Completed' ? 'completed' : ''}`}>
                            <div className="task-header">
                                <div className="task-title-area">
                                    <h3>{task.taskName}</h3>
                                    <div className="tags">
                                        <span className={`k-tag ${isCritical ? 'high-risk' : ''}`}>{task.priority || 'Medium'}</span>
                                        <span className="k-tag role-tag">{task.role || 'General'}</span>
                                        {isHighRisk && <span className="k-tag high-risk blink">RISK: DELAY LIKELY</span>}
                                    </div>
                                </div>
                                <div className="assignee-area">
                                    <span className="assignee-name">👤 {task.assignedPerson || 'Unassigned'}</span>
                                    <span className="deadline">⏳ {task.deadline || 'TBD'}</span>
                                </div>
                            </div>
                            
                            <p className="task-desc">{task.description}</p>
                            
                            <div className="progress-area">
                                <div className="progress-label">
                                    <span>PROGRESS</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div 
                                        className="progress-bar-fill" 
                                        style={{ 
                                            width: `${progress}%`,
                                            backgroundColor: progress === 100 ? '#22c55e' : (isHighRisk ? '#ef4444' : 'var(--accent-cyan)')
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="subtasks-area">
                                <h4>EXECUTION_STEPS</h4>
                                <div className="subtasks-list">
                                    {task.subtasks?.map((subtask, sIndex) => (
                                        <label key={sIndex} className="subtask-checkbox">
                                            <input 
                                                type="checkbox" 
                                                checked={subtask.completed || false} 
                                                onChange={() => toggleSubtask(tIndex, sIndex)}
                                                disabled={updating}
                                            />
                                            <span className="checkmark"></span>
                                            <span className={`st-text ${subtask.completed ? 'st-done' : ''}`}>{subtask.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="task-actions">
                                {task.status !== 'In Progress' && task.status !== 'Completed' && (
                                    <button className="btn-action start" onClick={() => markTaskStatus(tIndex, 'In Progress')} disabled={updating}>START_TASK</button>
                                )}
                                {task.status === 'In Progress' && (
                                    <button className="btn-action complete" onClick={() => markTaskStatus(tIndex, 'Completed')} disabled={updating}>MARK_COMPLETE</button>
                                )}
                                <button className="btn-action remind" onClick={() => simulateReminder(task)}>SEND_REMINDER</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`cyber-toast ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' ? '✅' : toast.type === 'reminder' ? '💬' : toast.type === 'error' ? '❌' : 'ℹ️'}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TaskExecutionSection;
