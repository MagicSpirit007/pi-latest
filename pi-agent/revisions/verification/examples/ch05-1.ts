// 自动从 ch05-tools.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
// 完整 SDK 示例；需要已配置的模型与凭据，验证时只做类型检查
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    tools: ["read", "powershell", "edit", "write"],
});
try {
    await session.prompt("列出当前目录的 TypeScript 文件，不修改文件。");
} finally {
    session.dispose();
}
