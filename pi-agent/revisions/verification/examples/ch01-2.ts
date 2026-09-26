// 自动从 ch01-overview.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；需要配置对应 Provider 的认证
import { Agent } from '@earendil-works/pi-agent-core';
import { getModel, streamSimple } from '@earendil-works/pi-ai/compat';

const agent = new Agent({
  streamFn: streamSimple,
  initialState: {
    model: getModel('anthropic', 'claude-sonnet-4-5'),
    systemPrompt: 'You are helpful.',
    tools: [],
  },
});
agent.subscribe(event => {
  if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
await agent.prompt('Hello!');


