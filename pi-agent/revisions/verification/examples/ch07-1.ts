// 自动从 ch07-event-driven.mdx 抽取；请修改 MDX 后重新生成。
// 完整示例；依赖版本见本书修订记录
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function finalCheck(pi: ExtensionAPI) {
    let requested = false;
    pi.on("agent_before_settle", (event) => {
        if (requested || event.outcome !== "completed") return;
        requested = true;
        return {
            entries: [...event.entries, {
                type: "custom_message",
                customType: "final-check",
                content: "请核对刚才的结论；若没有遗漏，简短确认即可。",
                display: false,
            }],
            continue: true,
        };
    });
    pi.on("agent_settled", () => { requested = false; });
}
