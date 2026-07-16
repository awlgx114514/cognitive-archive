# 认知之门 · Cognitive Archive

一个使用 Vite、React 与 TypeScript 构建的静态“潜意识认知探索”网站 Demo。当前版本完整支持首页、A/B/C 分支答题、返回改答、最终校准、结果页、重测、本地进度恢复和结果图保存。

> 当前题库和人格说明仍是 Demo，不构成心理诊断。网站没有后端，不登录、不上传答案，也不接入统计或广告脚本；答题路径只保存在当前浏览器。

## 在线访问

- GitHub Pages：<https://siusiu777.github.io/cognitive-archive/>
- 源代码：<https://github.com/siusiu777/cognitive-archive>

## 当前流程

第一题决定前缀首字母：

- A：静态相片
- B：动态电影或音频
- C：能动，但只有几秒

第二题决定前缀第二个字母：

- A：首先思考如何使用石头
- B：首先思考石头的本质

由此进入六条主路径：

| 前缀 | 候选结果 |
| --- | --- |
| `aa` | ESFP / ISFP / ENTJ / INTJ |
| `ab` | ESTP / ISTP / ENFJ / INFJ |
| `ba` | ESTJ / ISTJ / INFP |
| `bb` | ESFJ / ISFJ / INTP |
| `ca` | ENFP |
| `cb` | ENTP |

当前结果只由题目分支、候选线索与最终校准决定：

- 两条候选线索形成明确多数，且与校准一致：生成该校准结果；
- 两条候选线索一比一：由最终校准确定结果；
- 明确多数与最终校准冲突：不生成错误结果，提示重新测试；
- 单结果路径明确否认校准描述：提示重新测试。

当前版本不计算积分、八维分数、稳定度或第二接近类型，页面和保存的结果图也没有为这些内容预留空白区域。正式规则收到后再单独接入。

当前静态 Demo 不播放题间过场，选择后直接进入下一题。过场元数据和用户提供的 `trans_*.webp` 素材仍保留，之后可独立启用。

## 技术栈

- Vite
- React
- TypeScript
- 原生 CSS
- Vitest
- 浏览器 Canvas（保存结果图）

没有后端、数据库、账号系统或服务端运行时。

## 安装与运行

推荐使用 pnpm：

```bash
pnpm install
pnpm dev
```

也可以使用 npm：

```bash
npm install
npm run dev
```

开发服务器启动后，打开终端显示的本地地址。

## 检查与构建

```bash
npm run typecheck
npm test
npm run validate:content
npm run build
npm run preview
```

- `typecheck`：严格 TypeScript 检查；
- `test`：验证 A/B/C 分支、16 种结果、校准失败、回退改答和本地会话规则；
- `validate:content`：检查题库引用、所有可达路径和终点校准；
- `build`：生成 `dist/` 静态生产文件；
- `preview`：在本机预览生产构建。

## 项目结构

```text
src/
  app/                    应用入口
  components/             首页、答题、结果、弹窗、错误页、开发面板
  data/
    questions.ts          当前题库与 aa/ab/ba/bb/ca/cb 分支
    resultTypes.ts        16 种结果展示数据
    testConfig.ts         路径长度、存档版本等配置
    transitionScenes.ts   预留过场元数据
  engine/
    resultResolver.ts     候选线索、最终校准与重测判定
    testEngine.ts         分支前进、回退、截断旧路径、恢复校验
    validation.ts         题库结构化校验
    pathAnalysis.ts       可达路径与节点统计
  hooks/                  localStorage 会话与辅助 Hook
  styles/                 视觉变量、全局样式、减少动态效果
public/images/
  ui/                     用户提供的背景、装饰、按钮和图标
  results/                用户提供的 16 张人格结果图
  transitions/            用户提供的 14 张过场图（静态版暂不播放）
  fallback/               用户提供的本地占位图
```

## 修改题库

题目都位于 `src/data/questions.ts`，UI 组件没有写死题目内容。

普通分支节点示意：

```ts
makeQuestion({
  id: "Q_EXAMPLE",
  question: "问题正文",
  a: {
    title: "A 的简短标题",
    text: "A 的说明",
    nextQuestionId: "Q_NEXT_A",
  },
  b: {
    title: "B 的简短标题",
    text: "B 的说明",
    nextQuestionId: "Q_NEXT_B",
  },
});
```

候选线索选项使用 `typeHintId`；终点校准选项使用 `calibrationTypeId` 与 `terminal: true`。两者不会同时出现在同一个选项上。

## “不确定”选项

类型与引擎保留 U 选项能力，但当前题库没有启用。U 只记录选择，不参与候选线索判断，次数上限由 `testConfig.maxUncertainSelections` 控制。

## 返回与本地存档

- 每次回答都会写入完整历史；
- 返回上一题会显示原选择；
- 修改上游答案时，旧分支的后续记录会被截断；
- localStorage 键为 `cognitive-archive:test-session`；
- 题库结构不兼容时更新 `storageVersion`，旧存档会安全失效；
- 数据损坏会回到入口，不会造成白屏。

手动清除本地进度：

```js
localStorage.removeItem("cognitive-archive:test-session");
```

## 图片资源

前端只使用用户提供的本地 WebP：

- 首页：`public/images/ui/bg_home.webp`
- 答题：`public/images/ui/bg_question.webp`
- 结果：`public/images/ui/bg_result.webp`
- 16 张结果图：`public/images/results/{type}.webp`
- 加载失败占位：`public/images/ui/image_placeholder.webp`

当前过场素材缺少 `trans_06.webp`，但静态版本不播放过场，因此不影响完整流程。

## 结果图保存

结果页点击“保存结果图”后，浏览器使用 Canvas 生成 1080 × 1440 PNG。图片包含人格代码、名称、经典画面、结果摘要、倾向说明、档案编号和网站名称，不包含积分或分数。数据只在浏览器本地处理。

## 部署为公共网址

项目是纯静态网站，可以部署到 Vercel、Netlify 或其他静态托管平台，不需要自行购买或维护服务器。

构建命令：

```text
npm run build
```

输出目录：

```text
dist
```

仓库中的 `vercel.json` 和 `netlify.toml` 已包含对应配置。平台提供的免费子域名可以直接作为公共网址；自定义域名为可选项。

## 尚待补充

- 完整正式题库与复核；
- 用户后续提供的正式结果判定规则；
- 正式 16 类型中文名称与说明；
- 是否启用及如何编排题间过场动画；
- 缺少的 `trans_06.webp`（仅未来启用过场时需要）；
- 实际用户样本验证。

当前 Demo 的目标是可靠证明：六条前缀分支可走通、A/B/C 可完整作答、校准冲突会重测、返回改答会截断旧路径、刷新后可恢复进度、16 张结果图可按类型显示。
