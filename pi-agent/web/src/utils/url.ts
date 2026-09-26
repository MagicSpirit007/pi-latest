// src/utils/url.ts
// 部署适配：站点可能挂在域名根路径（Cloudflare Pages），也可能挂在子路径
// （GitHub Pages 项目站点形如 /<repo>/）。凡是站内绝对路径都要过 withBase()。
const rawBase = import.meta.env.BASE_URL || '/';
/** 归一化成一定以 "/" 结尾的形式（Astro 的 BASE_URL 可能不带尾斜杠）。 */
export const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

/** 给站内绝对路径补上部署 base；外部链接、协议相对链接、锚点原样返回。 */
export function withBase(path: string): string {
  if (!path) return BASE;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path) || path.startsWith('//') || path.startsWith('#')) {
    return path;
  }
  return `${BASE}${path.replace(/^\//, '')}`;
}
