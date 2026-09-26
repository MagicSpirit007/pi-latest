// 自动从 ch04-model-call.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
import { createModels } from '@earendil-works/pi-ai';
import { anthropicProvider } from '@earendil-works/pi-ai/providers/anthropic';

const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel('anthropic', 'claude-sonnet-4-5');
if (!model) throw new Error('模型不在已注册目录中');

const stream = models.streamSimple(model, {
  systemPrompt: 'Explain things clearly.',
  messages: [{ role: 'user', content: '什么是 Agent Loop？', timestamp: Date.now() }],
}, { reasoning: 'high' });

for await (const event of stream) {
  if (event.type === 'text_delta') process.stdout.write(event.delta);
  if (event.type === 'error') console.error(event.error.errorMessage);
}
const result = await stream.result();
console.log(result.stopReason, result.usage);
