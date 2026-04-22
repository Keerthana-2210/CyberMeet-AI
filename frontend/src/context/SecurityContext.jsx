import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/alerts`);
            // Initially, we might want to filter or store all
            setAlerts(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setLoading(false);
        }
    };

    const updateAlertStatus = async (id, status) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/alerts/${id}/status`, { status });
            // Update local state
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, status } : a));
            return true;
        } catch (err) {
            console.error('Failed to update status:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    return (
        <SecurityContext.Provider value={{ alerts, setAlerts, fetchAlerts, updateAlertStatus, loading }}>
            {children}
        </SecurityContext.Provider>
    );
};
