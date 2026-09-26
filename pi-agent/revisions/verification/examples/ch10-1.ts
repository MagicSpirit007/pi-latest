// 自动从 ch10-session.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
// 完整离线示例；只使用内存会话，不调用模型、不写磁盘
import { SessionManager } from "@earendil-works/pi-coding-agent";

const manager = SessionManager.inMemory();
const inputId = manager.appendMessage({
    role: "user", content: "日志：很多很多行……", timestamp: 1,
});
manager.appendContextEdit(inputId, { content: "日志摘要：三个测试失败。" });

const edited = manager.buildSessionProjection().messages[0];
if (edited?.role === "user") console.log(edited.content);
// 日志摘要：三个测试失败。

manager.appendContextEdit(inputId, null);
console.log(manager.buildSessionProjection().messages.length); // 0
console.log(manager.getEntries().length); // 3：原消息 + 两条编辑

manager.branch(inputId);
const restored = manager.buildSessionProjection().messages[0];
if (restored?.role === "user") console.log(restored.content);
// 日志：很多很多行……（这条路径上尚未经过编辑）
