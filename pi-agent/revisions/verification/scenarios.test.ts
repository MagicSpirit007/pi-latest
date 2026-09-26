import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Type } from 'typebox';
import { Agent, type AgentOptions, type AgentTool } from '@earendil-works/pi-agent-core';
import { createModels, InMemoryCredentialStore, normalizeContext, getCurrentTools, getCurrentSystemPrompt } from '@earendil-works/pi-ai';
import { fauxProvider, fauxAssistantMessage as answer, fauxToolCall as call, type FauxResponseStep } from '@earendil-works/pi-ai/providers/faux';
import { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import finalCheck from './examples/ch07-1.js';

function setup(responses: FauxResponseStep[], extra: Partial<AgentOptions> = {}, tools: AgentTool[] = []) {
  const faux = fauxProvider({ tokensPerSecond: 0 });
  faux.setResponses(responses);
  const models = createModels();
  models.setProvider(faux.provider);
  const agent = new Agent({
    ...extra,
    streamFn: (model, context, options) => models.streamSimple(model, context, options),
    initialState: { model: faux.getModel(), systemPrompt: 'Offline test.', tools },
  });
  return { agent, faux };
}
function tool(name: string, execute: AgentTool['execute'], mode?: 'sequential'): AgentTool {
  return { name, label: name, description: name, parameters: Type.Object({}), execute, executionMode: mode };
}
const ok = (terminate = false) => ({ content: [{ type: 'text' as const, text: 'ok' }], details: {}, terminate });

test('finishTurn continuation: first request preparation, next-turn preparation, event boundary order', async () => {
  const log: string[] = [];
  const { agent, faux } = setup([answer('one'), answer('two')], {
    prepareRequest: async () => { log.push('prepareRequest'); },
    prepareNextTurn: async () => { log.push('prepareNextTurn'); return undefined; },
    finishTurn: async () => { log.push('finishTurn'); return faux.state.callCount === 1 ? { action: 'continue' } : undefined; },
  });
  agent.subscribe(e => { if (['turn_start', 'turn_end', 'agent_end'].includes(e.type)) log.push(e.type); });
  await agent.prompt('start');
  assert.equal(faux.state.callCount, 2);
  assert.deepEqual(log, ['turn_start', 'prepareRequest', 'finishTurn', 'turn_end', 'prepareNextTurn', 'turn_start', 'prepareRequest', 'finishTurn', 'turn_end', 'agent_end']);
});

test('finishTurn end preserves follow-up and skips next-turn preparation', async () => {
  let prepared = 0;
  const { agent, faux } = setup([answer('done')], {
    finishTurn: async () => ({ action: 'end' }),
    prepareNextTurn: async () => { prepared++; return undefined; },
  });
  agent.followUp({ role: 'user', content: 'later', timestamp: 1 });
  await agent.prompt('now');
  assert.equal(faux.state.callCount, 1);
  assert.equal(prepared, 0);
  assert.equal(agent.hasQueuedMessages(), true);
});

test('error remains a hard exit even when finishTurn requests continuation', async () => {
  let finished = 0;
  const { agent, faux } = setup([answer('', { stopReason: 'error', errorMessage: 'offline error' })], {
    finishTurn: async () => { finished++; return { action: 'continue' }; },
  });
  await agent.prompt('start');
  assert.equal(finished, 1);
  assert.equal(faux.state.callCount, 1);
});

test('terminate is batch-wide, never skips sibling tools; mixed hints continue', async () => {
  for (const all of [true, false]) {
    const ran: string[] = [];
    const { agent, faux } = setup([
      answer([call('a', {}), call('b', {})], { stopReason: 'toolUse' }), answer('done'),
    ], {}, [tool('a', async () => { ran.push('a'); return ok(true); }), tool('b', async () => { ran.push('b'); return ok(all); })]);
    await agent.prompt('go');
    assert.deepEqual(ran.sort(), ['a', 'b']);
    assert.equal(faux.state.callCount, all ? 1 : 2);
  }
});

test('one sequential tool serializes the entire batch, including before/after hooks', async () => {
  const log: string[] = [];
  const { agent } = setup([answer([call('a', {}), call('b', {})], { stopReason: 'toolUse' }), answer('done')], {
    beforeToolCall: async ({ toolCall }) => { log.push(`before:${toolCall.name}`); return undefined; },
    afterToolCall: async ({ toolCall }) => { log.push(`after:${toolCall.name}`); return undefined; },
  }, [tool('a', async () => { log.push('execute:a'); return ok(); }), tool('b', async () => { log.push('execute:b'); return ok(); }, 'sequential')]);
  await agent.prompt('go');
  assert.deepEqual(log, ['before:a', 'execute:a', 'after:a', 'before:b', 'execute:b', 'after:b']);
});

test('parallel tool ends follow completion order; result messages follow assistant order', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  const ends: string[] = [], results: string[] = [];
  const { agent } = setup([answer([call('a', {}), call('b', {})], { stopReason: 'toolUse' }), answer('done')], {}, [
    tool('a', async () => { await gate; return ok(); }), tool('b', async () => ok()),
  ]);
  agent.subscribe(e => {
    if (e.type === 'tool_execution_end') { ends.push(e.toolName); if (e.toolName === 'b') release(); }
    if (e.type === 'message_end' && e.message.role === 'toolResult') results.push(e.message.toolName);
  });
  await agent.prompt('go');
  assert.deepEqual(ends, ['b', 'a']);
  assert.deepEqual(results, ['a', 'b']);
});

test('blocked preparation emits start/end but skips execute and afterToolCall', async () => {
  const log: string[] = [];
  const { agent } = setup([answer(call('a', {}), { stopReason: 'toolUse' })], {
    beforeToolCall: async () => { log.push('before'); return { block: true, terminate: true }; },
    afterToolCall: async () => { log.push('after'); return undefined; },
  }, [tool('a', async () => { log.push('execute'); return ok(); })]);
  agent.subscribe(e => { if (e.type.startsWith('tool_execution_')) log.push(e.type); });
  await agent.prompt('go');
  assert.deepEqual(log, ['tool_execution_start', 'before', 'tool_execution_end']);
});

test('truncated assistant tool calls never execute', async () => {
  let executed = 0;
  const { agent } = setup([answer(call('a', {}), { stopReason: 'length' }), answer('done')], {}, [tool('a', async () => { executed++; return ok(); })]);
  await agent.prompt('go');
  assert.equal(executed, 0);
  assert.ok(agent.state.messages.some(m => m.role === 'toolResult' && m.isError));
});

test('normalization carries system prompt and tool state in the transcript', () => {
  const context = normalizeContext({ systemPrompt: 'original', tools: [{ name: 'read', description: 'read', parameters: Type.Object({}) }], messages: [
    { role: 'user', content: 'hi', timestamp: 1 },
    { role: 'system', content: 'replacement', toolsRemoved: [{ name: 'read' }], timestamp: 2 },
  ] });
  assert.equal(context.messages[0].role, 'system');
  assert.equal(getCurrentSystemPrompt(context.messages), 'original\n\nreplacement');
  assert.deepEqual(getCurrentTools(context.messages), []);
  assert.equal('systemPrompt' in context, false);
});

test('context_edit changes only the active projection; rebranch and reopen preserve originals', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-book-session-'));
  const manager = SessionManager.create(dir, dir);
  const input = manager.appendMessage({ role: 'user', content: 'original', timestamp: 1 });
  manager.appendMessage(answer('reply'));
  manager.appendContextEdit(input, { content: 'summary' });
  const summary = manager.buildSessionProjection().messages.find(m => m.role === 'user');
  assert.equal(summary?.content, 'summary');
  const reopened = SessionManager.open(manager.getSessionFile()!);
  assert.equal(reopened.buildSessionProjection().messages.find(m => m.role === 'user')?.content, 'summary');
  reopened.appendContextEdit(input, null);
  assert.equal(reopened.buildSessionProjection().messages.some(m => m.role === 'user'), false);
  reopened.branch(input);
  assert.equal(reopened.buildSessionProjection().messages.find(m => m.role === 'user')?.content, 'original');
  assert.equal(reopened.getEntries().length, 4);
});

test('book extension continues before settlement; ordinary subscriptions do not await promises', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pi-book-sdk-'));
  const log: string[] = [];
  const requests: string[] = [];
  const faux = fauxProvider({ tokensPerSecond: 0 });
  faux.setResponses([answer('first'), context => { requests.push(JSON.stringify(context)); return answer('checked'); }]);
  const runtime = await ModelRuntime.create({ credentials: new InMemoryCredentialStore(), modelsPath: null, modelsStorePath: join(cwd, 'models-cache'), refreshOnCreate: false });
  runtime.registerNativeProvider(faux.provider);
  const settings = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } });
  const loader = new DefaultResourceLoader({ cwd, agentDir: cwd, settingsManager: settings, noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
    extensionFactories: [finalCheck, (pi: ExtensionAPI) => {
      pi.on('turn_end', () => { log.push('extension:turn_end'); });
      pi.on('agent_before_settle', () => { log.push('before_settle'); });
      pi.on('agent_settled', () => { log.push('settled'); });
    }],
  });
  await loader.reload();
  const { session } = await createAgentSession({ cwd, agentDir: cwd, modelRuntime: runtime, model: faux.getModel(), resourceLoader: loader, settingsManager: settings, sessionManager: SessionManager.inMemory(cwd), noTools: 'all' });
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  let subscriberCompleted = false;
  session.subscribe(async event => {
    if (event.type === 'turn_end') log.push('subscribe:turn_end');
    if (event.type === 'agent_end') { log.push('agent_end'); await gate; subscriberCompleted = true; }
  });
  try {
    await session.prompt('start');
    assert.equal(faux.state.callCount, 2);
    assert.match(requests[0], /请核对刚才的结论/);
    assert.equal(subscriberCompleted, false);
    assert.equal(log.filter(x => x === 'settled').length, 1);
    assert.ok(log.indexOf('extension:turn_end') < log.indexOf('subscribe:turn_end'));
    assert.ok(log.indexOf('agent_end') < log.indexOf('before_settle'));
    assert.equal(log.at(-1), 'settled');
  } finally { release(); session.dispose(); }
});
