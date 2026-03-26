const { analyzeContent } = require('./services/detectionService');

const runTests = async () => {
  const tests = [
    {
      name: 'User Reported Sample (Scam)',
      content: 'Congratulations! You’ve Won ₹50,000! You have been selected as a lucky winner. Claim your reward now by submitting your bank details. Limited time offer!',
      expected: true
    },
    {
      name: 'Gift Card Scam',
      content: 'You have been awarded a $500 Amazon Gift card! Click here to claim your prize immediately.',
      expected: true
    },
    {
      name: 'Safe Message',
      content: 'Hello, let us meet for coffee tomorrow at 10 AM.',
      expected: false
    },
    {
      name: 'Urgent Request',
      content: 'URGENT: Your account access has been suspended. Please verify your identity immediately to avoid permanent closure.',
      expected: true
    },
    {
      name: 'Suspicious TLD',
      content: 'Check out this cool new site: http://free-gifts.click',
      expected: true
    }
  ];

  console.log('--- STARTING DETECTION TESTS ---');
  const results = [];
  for (const test of tests) {
    const result = await analyzeContent(test.content);
    const passed = result.isSuspicious === test.expected;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.name}`);
    results.push({ name: test.name, passed, result });
  }
  const fs = require('fs');
  fs.writeFileSync('backend/test_results.json', JSON.stringify(results, null, 2));
  console.log('--- TESTS COMPLETE ---');
};

runTests();
