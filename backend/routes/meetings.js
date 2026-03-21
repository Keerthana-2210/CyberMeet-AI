const express = require('express');
const router = express.Router();
const multer = require('multer');
const Meeting = require('../models/Meeting');

// Mock AI Service Ported
const mockProcessMeeting = async (title) => {
  await new Promise(r => r(setTimeout, 2000));
  return {
    transcript: "This is a mock transcript for the meeting: " + title,
    summary: "The team discussed progress on the unified hub integration. Key focus was on merging security and productivity modules.",
    sentiment: "Positive",
    sentimentScore: 0.85,
    actionItems: [
      { task: "Complete dashboard integration", assignee: "Dev Team", status: "Pending" },
      { task: "Test AI detection routes", assignee: "QA", status: "In Progress" }
    ]
  };
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const { title } = req.body;
    const meeting = new Meeting({ title, audioUrl: req.file ? req.file.path : null });
    await meeting.save();
    
    // Background processing
    mockProcessMeeting(title).then(async (result) => {
      await Meeting.findByIdAndUpdate(meeting._id, result);
    });

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

module.exports = router;
