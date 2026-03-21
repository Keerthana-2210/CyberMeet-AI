const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const detectionService = require('../services/detectionService');

// @route   GET api/alerts
// @desc    Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/alerts/analyze
// @desc    Analyze content and create alert if suspicious
router.post('/analyze', async (req, res) => {
  try {
    const { content, source } = req.body;
    const result = await detectionService.analyzeContent(content);
    
    if (result.isSuspicious) {
      const newAlert = new Alert({
        type: result.type,
        severity: result.severity,
        description: result.reason,
        source: source || 'External Input'
      });
      await newAlert.save();
      return res.json({ alerted: true, alert: newAlert });
    }
    
    res.json({ alerted: false });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PATCH api/alerts/:id/ticket
// @desc    Create/Update ticket status
router.patch('/:id/ticket', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { 
      status: 'In Progress',
      ticketCreated: true 
    });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
