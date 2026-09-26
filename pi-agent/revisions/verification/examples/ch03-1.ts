// 自动从 ch03-agent-loop.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
import { Agent } from '@earendil-works/pi-agent-core';
import { getModel, streamSimple } from '@earendil-works/pi-ai/compat';

let completed = 0;
const agent = new Agent({
  streamFn: streamSimple,
  initialState: {
    model: getModel('anthropic', 'claude-sonnet-4-5'),
    systemPrompt: 'Answer briefly.',
    tools: [],
  },
  finishTurn: async ({ message }) => {
    if (message.stopReason === 'error' || message.stopReason === 'aborted') return;
    completed += 1;
    if (completed >= 3) return { action: 'end' };
  },
});
await agent.prompt('Explain an agent loop.');
