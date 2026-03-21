// Mock AI Detection Service for Cybersecurity Incidents

const analyzeContent = async (content) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const suspiciousKeywords = ['password', 'credit card', 'urgent', 'verify', 'click here', 'immediate action'];
  const contentLower = content.toLowerCase();
  
  const matched = suspiciousKeywords.filter(k => contentLower.includes(k));
  
  if (matched.length >= 3) {
    return {
      isSuspicious: true,
      type: 'Critical Phishing Attempt',
      severity: 'High',
      confidence: 0.95,
      reason: `Found multiple suspicious keywords: ${matched.join(', ')}`
    };
  } else if (matched.length >= 1) {
    return {
      isSuspicious: true,
      type: 'Suspicious Content Detected',
      severity: 'Medium',
      confidence: 0.75,
      reason: `Found suspicious keyword: ${matched[0]}`
    };
  }
  
  return { isSuspicious: false };
};

const classifyIncident = (logEntry) => {
  // Simple heuristic classification
  if (logEntry.includes('failed login') && logEntry.includes('repeated')) {
    return { type: 'Brute Force Attempt', severity: 'High' };
  }
  if (logEntry.includes('unauthorized') || logEntry.includes('denied')) {
    return { type: 'Unauthorized Access', severity: 'Medium' };
  }
  return { type: 'General Security Event', severity: 'Low' };
};

module.exports = {
  analyzeContent,
  classifyIncident
};
