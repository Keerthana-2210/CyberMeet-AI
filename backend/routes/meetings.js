const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Groq = require('groq-sdk');
const Meeting = require('../models/Meeting');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const processMeeting = async (title, audioPath) => {
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

    const prompt = `Analyze the following meeting transcript. Provide a JSON response with the following keys exactly:
"summary": A detailed, multi-point overview of what was discussed.
"sentiment": A single word (Positive, Neutral, or Negative).
"sentimentScore": A number from 0 to 1 representing the positivity.
"actionItems": An array of objects, each with "task", "assignee" (default "Unassigned"), and "status" (default "Pending").

Transcript:
${transcript}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(chatCompletion.choices[0].message.content);
    
    return {
      transcript: transcript,
      summary: aiResult.summary || "Summary not generated.",
      sentiment: aiResult.sentiment || "Neutral",
      sentimentScore: aiResult.sentimentScore || 0.5,
      actionItems: aiResult.actionItems || []
    };
  } catch (error) {
    console.error("Groq Processing Error:", error);
    return {
      transcript: "Error processing audio or generating response.",
      summary: "AI processing failed.",
      sentiment: "Neutral",
      sentimentScore: 0.5,
      actionItems: []
    };
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
    
    // Background processing
    processMeeting(title, meeting.audioUrl).then(async (result) => {
      try {
        await Meeting.findByIdAndUpdate(meeting._id, result);
      } catch (err) {
        console.error('Background Update Error:', err);
      }
    }).catch(err => console.error('Mock Processing Error:', err));

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
