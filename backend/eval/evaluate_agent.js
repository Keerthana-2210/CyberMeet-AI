const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const agentOrchestrator = require('../services/agentOrchestrator');
const testCases = require('./test_dataset.json');

const runEvaluation = async () => {
  console.log("==================================================================");
  console.log("   AGENTIC AI SYSTEM - EVALUATION & BENCHMARK HARNESS");
  console.log("==================================================================\n");

  let totalTests = testCases.length;
  let passedTests = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[Eval ${i + 1}/${totalTests}] Testing: "${tc.name}"`);

    const startTime = Date.now();
    let state;
    let evalErrors = [];

    try {
      state = await agentOrchestrator.runAgentWorkflow(tc.transcript, tc.name, tc.id);

      // Metric 1: Structured Output Validity
      const isValidSchema = (
        state &&
        typeof state.summary === 'string' &&
        typeof state.sentiment === 'string' &&
        Array.isArray(state.actionItems) &&
        Array.isArray(state.executionPlan) &&
        Array.isArray(state.agentActions)
      );

      if (!isValidSchema) {
        evalErrors.push(`Invalid JSON/state schema output. Types: summary=${typeof state?.summary}, sentiment=${typeof state?.sentiment}, actionItems=${Array.isArray(state?.actionItems)}, executionPlan=${Array.isArray(state?.executionPlan)}, agentActions=${Array.isArray(state?.agentActions)}`);
      }

      // Extract tool names executed from state.agentActions
      const executedTools = state.agentActions
        .filter(a => a.type === 'TOOL_START')
        .map(a => a.message.replace('Tool: ', '').replace(' initiated.', ''));

      // Metric 2: Security Detection & Ticket Creation Accuracy
      const isThreatDetected = Boolean(state.securityThreat && state.securityThreat.isSuspicious);
      const isTicketCreated = Boolean(state.incidentTicket && state.incidentTicket.ticketId);

      if (tc.expected.expectThreat !== isThreatDetected) {
        evalErrors.push(`Security threat mismatch. Expected: ${tc.expected.expectThreat}, Got: ${isThreatDetected}`);
      }

      if (tc.expected.expectTicket !== isTicketCreated) {
        evalErrors.push(`Incident ticket mismatch. Expected: ${tc.expected.expectTicket}, Got: ${isTicketCreated}`);
      }

      // Metric 3: Tool Selection Accuracy
      const missingTools = tc.expected.expectedTools.filter(t => !executedTools.includes(t));
      if (missingTools.length > 0) {
        evalErrors.push(`Missing expected tool calls: ${missingTools.join(', ')}`);
      }

      const duration = Date.now() - startTime;
      const passed = evalErrors.length === 0;

      if (passed) {
        passedTests++;
        console.log(`   --> [PASS] Completed in ${duration}ms. Executed tools: [${executedTools.join(', ')}]`);
      } else {
        console.log(`   --> [FAIL] Completed in ${duration}ms.`);
        evalErrors.forEach(err => console.log(`       - ${err}`));
      }

      results.push({
        id: tc.id,
        name: tc.name,
        passed,
        durationMs: duration,
        executedTools,
        securityStatus: state.securityStatus,
        ticketCreated: isTicketCreated,
        errors: evalErrors
      });

    } catch (err) {
      console.log(`   --> [CRASH] Test failed with exception: ${err.message}`);
      results.push({
        id: tc.id,
        name: tc.name,
        passed: false,
        durationMs: 0,
        errors: [err.message]
      });
    }

    console.log("------------------------------------------------------------------");
  }

  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log("\n==================================================================");
  console.log(`   BENCHMARK EVALUATION COMPLETE`);
  console.log(`   Passed: ${passedTests}/${totalTests} (${passRate}%)`);
  console.log("==================================================================\n");

  const fs = require('fs');
  const reportPath = path.join(__dirname, 'eval_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    passRate: `${passRate}%`,
    results
  }, null, 2));

  console.log(`Full report saved to: ${reportPath}\n`);
};

runEvaluation();
