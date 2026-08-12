const Groq = require('groq-sdk');
const detectionService = require('./detectionService');
const Alert = require('../models/Alert');
const fs = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Creates a clean initial state object for the agent workflow.
 */
const createInitialState = (transcript, title = "Untitled Meeting", meetingId = null) => ({
  meetingId,
  title,
  transcript: transcript || "",
  summary: "",
  sentiment: "Neutral",
  sentimentScore: 0.5,
  actionItems: [],
  executionPlan: [],
  securityStatus: "No Threat Detected",
  securityThreat: null,
  incidentTicket: null,
  agentActions: [],
  errors: []
});

/**
 * Log helper to add timestamped entries to agentActions.
 */
const logAction = (state, type, message, metadata = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type, // 'AGENT_PLAN', 'TOOL_START', 'TOOL_COMPLETE', 'TOOL_ERROR', 'WORKFLOW_FINISH'
    message,
    metadata
  };
  state.agentActions.push(logEntry);
  console.log(`[AgentLog] [${type}] ${message}`);
};

/**
 * Tool 1: summarize_meeting
 * Generates meeting summary and sentiment analysis using Groq LLM.
 */
const summarize_meeting = async (state) => {
  logAction(state, 'TOOL_START', 'Tool: summarize_meeting initiated.');
  const startTime = Date.now();

  try {
    const prompt = `Analyze the following meeting transcript and generate a summary and sentiment analysis.
Return a valid JSON object with:
- "summary": A detailed, multi-point summary of key discussions and decisions.
- "sentiment": "Positive", "Neutral", or "Negative".
- "sentimentScore": A float from 0.0 to 1.0 (positivity score).

Transcript:
${state.transcript}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    let summaryText = parsed.summary || "Summary generated.";
    if (typeof summaryText === 'object') {
      summaryText = Array.isArray(summaryText) ? summaryText.join('\n') : Object.entries(summaryText).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    }
    state.summary = String(summaryText);
    state.sentiment = String(parsed.sentiment || "Neutral");
    state.sentimentScore = Number(parsed.sentimentScore ?? 0.5);

    const duration = Date.now() - startTime;
    logAction(state, 'TOOL_COMPLETE', `Tool: summarize_meeting completed in ${duration}ms.`, {
      sentiment: state.sentiment,
      summaryLength: state.summary.length
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    state.summary = "Error generating summary.";
    state.errors.push(`summarize_meeting error: ${err.message}`);
    logAction(state, 'TOOL_ERROR', `Tool: summarize_meeting failed after ${duration}ms: ${err.message}`);
  }
};

/**
 * Tool 2: extract_tasks
 * Extracts structured action items and an engineering execution plan.
 */
const extract_tasks = async (state) => {
  logAction(state, 'TOOL_START', 'Tool: extract_tasks initiated.');
  const startTime = Date.now();

  try {
    const prompt = `Extract action items and an engineering execution plan from this transcript.
Return a JSON object with:
"actionItems": Array of objects { "task": string, "assignee": string, "status": "Pending" | "In Progress" | "Completed" }
"executionPlan": Array of objects for major tasks with keys:
  - "taskName": Main goal title
  - "description": Why this task is needed
  - "priority": "High" | "Medium" | "Low"
  - "assignedPerson": Name or "Unassigned"
  - "role": "Frontend" | "Backend" | "DevOps" | "QA" | "Product" | "Security"
  - "deadline": e.g. "2026-04-25" or "TBD"
  - "risk": "Normal" | "High Risk" | "Delay Likely"
  - "subtasks": Array of objects { "id": string, "text": string, "completed": false }

Transcript:
${state.transcript}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    state.actionItems = parsed.actionItems || [];
    state.executionPlan = parsed.executionPlan || [];

    const duration = Date.now() - startTime;
    logAction(state, 'TOOL_COMPLETE', `Tool: extract_tasks completed in ${duration}ms.`, {
      actionItemsCount: state.actionItems.length,
      executionPlanCount: state.executionPlan.length
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    state.actionItems = [];
    state.executionPlan = [];
    state.errors.push(`extract_tasks error: ${err.message}`);
    logAction(state, 'TOOL_ERROR', `Tool: extract_tasks failed after ${duration}ms: ${err.message}`);
  }
};

/**
 * Tool 3: detect_security_threat
 * Analyzes transcript & summary for cybersecurity risks using hybrid rules + LLM verification.
 */
const detect_security_threat = async (state) => {
  logAction(state, 'TOOL_START', 'Tool: detect_security_threat initiated.');
  const startTime = Date.now();

  try {
    // 1. Heuristic & pattern detection
    const fullText = `${state.summary}\n\n${state.transcript}`;
    const ruleAnalysis = await detectionService.analyzeContent(fullText);

    // 2. LLM Verification for high precision
    const prompt = `Evaluate if this meeting transcript describes a genuine cybersecurity incident, data breach, ransomware attack, unauthorized access, or phishing scam.
Return a JSON object:
{
  "isThreat": boolean,
  "threatType": string (e.g. "Ransomware Attack", "Phishing Attempt", "Unauthorized Access", "Insider Threat", "None"),
  "severity": "High" | "Medium" | "Low" | "None",
  "reason": string,
  "confidence": number (0 to 1)
}

Transcript:
${state.transcript}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const llmAnalysis = JSON.parse(completion.choices[0].message.content);
    const isThreat = (llmAnalysis.isThreat && (ruleAnalysis.isSuspicious || (llmAnalysis.confidence >= 0.75)));
    const duration = Date.now() - startTime;

    if (isThreat) {
      const threatType = llmAnalysis.threatType !== "None" ? llmAnalysis.threatType : (ruleAnalysis.type || "Security Incident");
      const severity = llmAnalysis.severity !== "None" ? llmAnalysis.severity : (ruleAnalysis.severity || "Medium");
      const reason = llmAnalysis.reason || ruleAnalysis.reason || "Suspicious cybersecurity indicators found in meeting context.";

      state.securityStatus = severity === "High" ? "Critical Threat Detected" : "Suspicious Activity Detected";
      state.securityThreat = {
        isSuspicious: true,
        type: threatType,
        severity,
        confidence: llmAnalysis.confidence || ruleAnalysis.confidence || 0.85,
        reason
      };

      logAction(state, 'TOOL_COMPLETE', `Tool: detect_security_threat found THREAT (${threatType}, ${severity}) in ${duration}ms.`, state.securityThreat);
    } else {
      state.securityStatus = "No Threat Detected";
      state.securityThreat = { isSuspicious: false, type: "None", severity: "None", reason: "Clean transcript." };
      logAction(state, 'TOOL_COMPLETE', `Tool: detect_security_threat evaluated CLEAN in ${duration}ms.`);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    state.securityStatus = "Scan Failed";
    state.securityThreat = null;
    state.errors.push(`detect_security_threat error: ${err.message}`);
    logAction(state, 'TOOL_ERROR', `Tool: detect_security_threat failed after ${duration}ms: ${err.message}`);
  }
};

/**
 * Tool 4: create_incident_ticket
 * Generates an incident alert ticket in the SOC store.
 */
const create_incident_ticket = async (state) => {
  logAction(state, 'TOOL_START', 'Tool: create_incident_ticket initiated.');
  const startTime = Date.now();

  try {
    if (!state.securityThreat || !state.securityThreat.isSuspicious) {
      logAction(state, 'TOOL_COMPLETE', 'Tool: create_incident_ticket skipped - no threat detected.');
      return;
    }

    const newAlert = new Alert({
      type: state.securityThreat.type,
      severity: state.securityThreat.severity,
      description: state.securityThreat.reason,
      source: `Meeting: ${state.title}`
    });

    await newAlert.save();
    await Alert.findByIdAndUpdate(newAlert._id, { status: 'In Progress', ticketCreated: true });

    state.incidentTicket = {
      ticketId: newAlert._id,
      type: newAlert.type,
      severity: newAlert.severity,
      description: newAlert.description,
      source: newAlert.source,
      status: 'In Progress',
      createdTime: newAlert.timestamp
    };

    const duration = Date.now() - startTime;
    logAction(state, 'TOOL_COMPLETE', `Tool: create_incident_ticket created ticket #${newAlert._id} in ${duration}ms.`, state.incidentTicket);
  } catch (err) {
    const duration = Date.now() - startTime;
    state.errors.push(`create_incident_ticket error: ${err.message}`);
    logAction(state, 'TOOL_ERROR', `Tool: create_incident_ticket failed after ${duration}ms: ${err.message}`);
  }
};

/**
 * Agent Decision & Execution Orchestrator
 * Analyzes the transcript, selects necessary tools dynamically, updates explicit state, and logs actions.
 */
const runAgentWorkflow = async (transcript, title = "Untitled Meeting", meetingId = null) => {
  const state = createInitialState(transcript, title, meetingId);

  logAction(state, 'AGENT_PLAN', `[Agent] Workflow started for session "${title}". State initialized.`);

  // Validation: Empty or short transcript check
  if (!transcript || transcript.trim().length === 0 || transcript === "No audio provided.") {
    logAction(state, 'AGENT_PLAN', '[Agent] Empty transcript provided. Gracefully completing empty workflow.');
    state.summary = "No audio transcript available for analysis.";
    state.securityStatus = "No Data";
    logAction(state, 'WORKFLOW_FINISH', '[Agent] Workflow completed with no data.');
    return state;
  }

  // 1. Mandatory Baseline Tools
  logAction(state, 'AGENT_PLAN', '[Agent] Dynamic Planning: Queueing core intelligence tools (summarize_meeting, extract_tasks).');
  await summarize_meeting(state);
  await extract_tasks(state);

  // 2. LLM Action Selection for Security Evaluation
  const keywords = ['hack', 'breach', 'password', 'urgent', 'verify', 'ransomware', 'malware', 'leak', 'unauthorized', 'attack', 'suspicious', 'phishing', 'bank', 'credit', 'exfiltrat', 'security'];
  const textLower = (transcript + " " + state.summary).toLowerCase();
  const hasSecurityKeywords = keywords.some(k => textLower.includes(k));

  if (hasSecurityKeywords) {
    logAction(state, 'AGENT_PLAN', '[Agent] Security indicators detected in meeting context. Planning action: detect_security_threat.');
    await detect_security_threat(state);

    if (state.securityThreat && state.securityThreat.isSuspicious) {
      logAction(state, 'AGENT_PLAN', `[Agent] Threat confirmed (${state.securityThreat.type}). Planning action: create_incident_ticket.`);
      await create_incident_ticket(state);
    } else {
      logAction(state, 'AGENT_PLAN', '[Agent] Security analysis concluded no active threat. Skipping ticket creation.');
    }
  } else {
    logAction(state, 'AGENT_PLAN', '[Agent] No security indicators found. Skipping security detection & ticket tools.');
  }

  logAction(state, 'WORKFLOW_FINISH', '[Agent] Agentic workflow executed successfully. Final state captured.');
  return state;
};

module.exports = {
  createInitialState,
  runAgentWorkflow,
  tools: {
    summarize_meeting,
    extract_tasks,
    detect_security_threat,
    create_incident_ticket
  }
};
