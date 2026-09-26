// 自动从 ch01-overview.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
import { createAgentSession } from '@earendil-works/pi-coding-agent';
import { getModel } from '@earendil-works/pi-ai/compat';

const { session } = await createAgentSession({
  cwd: process.cwd(),
  model: getModel('anthropic', 'claude-sonnet-4-5'), // Model 对象，不是 {id, api}
});

// subscribe 接收一个监听器函数，事件类型是 AgentSessionEvent 联合类型
session.subscribe((event) => {
  if (event.type === 'turn_end') {
    console.log('Agent 完成了一轮思考');
  }
});

try {
  await session.prompt('Read the codebase and explain the architecture.');
} finally {
  session.dispose();
}
