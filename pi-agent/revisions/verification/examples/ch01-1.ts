// 自动从 ch01-overview.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
// 入口在 compat 子模块（不在主入口）
import { getModel, stream } from '@earendil-works/pi-ai/compat';
import type { Context } from '@earendil-works/pi-ai';

const model = getModel('anthropic', 'claude-sonnet-4-5');
// Context 是 interface（不是 class），用对象字面量构造
const context: Context = {
  systemPrompt: 'You are helpful.',
  messages: [{ role: 'user', content: 'Hello!', timestamp: Date.now() }],
};

// stream() 返回事件流；complete() 则直接 await 拿到最终 AssistantMessage
const eventStream = stream(model, context);
for await (const event of eventStream) {
  if (event.type === 'text_delta') process.stdout.write(event.delta);
}
