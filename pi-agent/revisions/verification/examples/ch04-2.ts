// 自动从 ch04-model-call.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
import { createAgentSession, ModelRuntime } from '@earendil-works/pi-coding-agent';

const modelRuntime = await ModelRuntime.create();
const model = modelRuntime.getModel('anthropic', 'claude-sonnet-4-5');
if (!model) throw new Error('模型未找到');

const { session } = await createAgentSession({ modelRuntime, model });
try {
  await session.prompt('解释当前项目的结构。');
} finally {
  session.dispose();
}
