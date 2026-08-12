// Mock AI Detection Service for Cybersecurity Incidents

const analyzeContent = async (content) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const suspiciousKeywords = [
    'password', 'credit card', 'urgent', 'verify', 'click here', 
    'immediate action', 'security', 'identity', 'suspension', 
    'login', 'account', 'verify your identity', 'official notice',
    'security-verification', 'suspicious activity', 'unauthorized access',
    'won', 'winner', 'prize', 'reward', 'bank details', 'transfer', 
    'congratulations', 'lucky', 'claim', 'lottery', 'cash', 'gift card',
    'hacked', 'hacked.', 'breach', 'ransomware', 'malware', 'exfiltrat',
    'database', 'compromised', 'vulnerability', 'backdoor', 'leak', 'zero-day',
    'phishing', 'exploit', 'unauthorized', 'attack'
  ];
  const contentLower = content.toLowerCase();
  
  const matchedKeywords = suspiciousKeywords.filter(k => contentLower.includes(k));
  
  // Robust Regex for suspicious patterns
  const patterns = [
    /\b(http|https):\/\/[^\s]+(\.xyz|\.click|\.top|\.bit|\.online)\b/i, // Suspicious TLDs
    /\b(suspended|closed|locked|disabled)\b.*\b(account|access)\b/i,
    /\b(verify|confirm|validate)\b.*\b(details|identity|login|credentials)\b/i,
    /\b(security|support|team|admin)\b.*\b(alert|update|notification)\b/i,
    /\b(failure to act|immediate action|urgent)\b/i,
    /\b(congratulations|lucky|won|winner)\b.*\b(prize|reward|amount|cash|lottery)\b/i, // Scam rewards
    /\b(bank details|account details|credit card)\b.*\b(submit|provide|verify|update)\b/i, // Financial phishing
    /\b(database|server|system)\b.*\b(hacked|breached|compromised|encrypted|down)\b/i, // Breach / Ransomware
    /\b(ransom|decrypt|payment|bitcoin)\b/i, // Ransomware specific
    /\b(unauthorized|suspicious)\b.*\b(download|access|export|transfer|logins?)\b/i // Insider threat / exfiltration
  ];
  
  const matchedPatterns = patterns.filter(p => p.test(content));
  
  const score = matchedKeywords.length + (matchedPatterns.length * 2);
  
  if (score >= 4) {
    return {
      isSuspicious: true,
      type: 'Critical Cybersecurity Threat',
      severity: 'High',
      confidence: 0.95,
      reason: `Critical risk patterns detected: ${matchedKeywords.slice(0, 3).join(', ')}${matchedPatterns.length > 0 ? ' + pattern matches' : ''}`
    };
  } else if (score >= 2) {
    return {
      isSuspicious: true,
      type: 'Suspicious Security Indicator',
      severity: 'Medium',
      confidence: 0.75,
      reason: `Suspicious elements found: ${matchedKeywords.slice(0, 2).join(', ') || 'Pattern match'}`
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
