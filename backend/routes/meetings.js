const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Groq = require('groq-sdk');
const Meeting = require('../models/Meeting');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const agentOrchestrator = require('../services/agentOrchestrator');

const processMeeting = async (meetingId, title, audioPath) => {
  try {
    let transcript = "No audio provided.";
    if (audioPath && fs.existsSync(audioPath)) {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-large-v3",
        response_format: "text",
      });
      transcript = transcription.text || transcription;
    }

    // Delegate analysis & security workflow to Agent Orchestrator
    const agentState = await agentOrchestrator.runAgentWorkflow(transcript, title, meetingId);

    // Persist final agent state into database
    await Meeting.findByIdAndUpdate(meetingId, {
      transcript: agentState.transcript,
      summary: agentState.summary,
      sentiment: agentState.sentiment,
      sentimentScore: agentState.sentimentScore,
      actionItems: agentState.actionItems,
      executionPlan: agentState.executionPlan,
      securityStatus: agentState.securityStatus,
      incidentTicket: agentState.incidentTicket,
      agentActions: agentState.agentActions
    });
  } catch (error) {
    console.error("Groq Processing Error:", error);
    await Meeting.findByIdAndUpdate(meetingId, {
      transcript: "Error processing audio.",
      summary: "AI Agent processing encountered an error.",
      securityStatus: "Error",
      agentActions: [
        {
          timestamp: new Date().toISOString(),
          type: "WORKFLOW_ERROR",
          message: `Processing failed: ${error.message}`,
          metadata: {}
        }
      ]
    });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    let ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    const supported = ['.flac', '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.ogg', '.wav', '.webm'];
    if (!supported.includes(ext)) {
      ext = '.m4a'; // Map unsupported like .aac to .m4a
    }
    cb(null, Date.now() + '-audio' + ext);
  }
});
const upload = multer({ storage });

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const { title } = req.body;
    const meeting = new Meeting({ title, audioUrl: req.file ? req.file.path : null });
    await meeting.save();
    
    // Background Agent Workflow Processing
    processMeeting(meeting._id, title, meeting.audioUrl).catch(err => console.error('Agent Background Error:', err));

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ msg: 'Not found' });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.patch('/:id/update-execution', async (req, res) => {
  try {
    const { executionPlan } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { executionPlan });
    if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await Meeting.findByIdAndRemove(req.params.id);
    if (!success) return res.status(404).json({ msg: 'Meeting not found' });
    res.json({ msg: 'Meeting removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
