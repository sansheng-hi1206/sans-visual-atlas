# San's visual library

539 条视觉参考、提示词与动效示例，包含 504 条 LetzAI VFX Atlas 资料及 35 条本地教程与视频参考。

网页入口：[打开 San’s 视觉图鉴](https://sansheng-hi1206.github.io/sans-visual-atlas/)

页面所用图片、视频和代码随仓库存放，浏览图鉴无需登录 GitHub 或 ChatGPT。

本地内容修改后需更新本仓库；推送到 `main` 分支后，GitHub Pages 会自动重新发布。

## 来源与许可

原始来源：https://atlas.letz.ai/ 。各素材的作者、来源和许可保留在卡片“更多”中。素材和原始文字不因公开仓库而自动获得统一开源许可。本地教程片段的作者与许可尚待核实。

中文整理：San’s。

## 本地开发和发布

安装依赖后运行 `npm run dev` 预览。`npm test` 检查标题、分页完整性和预览素材；`npm run build` 生成含全部素材的 `dist/`。

2026-11-20，经预览确认新增 26 条本地动效，编号“本地 10–35”，包含补充的“立体画带翻滚”。卡片保留原画面裁切预览、中文介绍、整理补充的动作提示词和示例说法，以及“更多”中的完整画面摘录、来源时间、作者与许可说明。顶部视频为原片摘录；提示词中的建议参数尚未实测复现。来源路径、SHA-256、筛选记录和裁切范围见 `sources/1120-import.json`。原下载视频及早期样卡目录未修改。

发布使用 `.github/workflows/pages.yml`：推送到 `main` 后自动测试、构建并发布到 GitHub Pages。页面使用的 React、GSAP、Motion 均打包到站内，不依赖外部 CDN。

## 动效组件

使用用户提供的 React Bits JavaScript + CSS 组件：AnimatedContent、OrbitImages、RotatingText、AccordionGallery。为分页选择联动和手机布局做了适配。React Bits 作者 David Haz；OrbitImages 原作者 Dominik Koch。许可保存在 `src/components/REACT_BITS_LICENSE.md`，构建产物中同时包含 `licenses/react-bits.txt`。
