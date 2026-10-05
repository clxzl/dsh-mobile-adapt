# dsh-mobile-adapt

**DSH Web GUI 的手机端适配层** —— 让 DeepSeek Harness 在手机上真正能用。

[English](README_EN.md) · 中文

<p align="center">
  <img src="docs/phone-home.jpg" width="32%" alt="手机端首页" />
  <img src="docs/settings-after.png" width="32%" alt="设置页" />
</p>

## 它解决什么

DSH 的 Web GUI 是一套**纯桌面布局**：样式表里只有 `prefers-reduced-motion` 一种媒体查询，
**没有任何宽度断点**；布局宽度由 AppFrame 的 JS 求解器直接内联写在元素上。
所以窄屏下它只是把侧边栏"折叠"成 56px 的图标 rail，那 56px 依然占着横向空间。

390px 视口下的实测对比：

| | 原生 | 装上本插件 |
|---|---|---|
| 内容区宽度 | **334px**（被 56px rail 吃掉） | **390px** 满宽 |
| 侧边栏 | 只剩图标 rail，会话列表看不到 | 86vw 抽屉 + 遮罩，按钮或边缘右滑打开 |
| 设置页内容区 | **154px**，标签逐字换行 | **390px** 正常单栏 |
| 折叠摘要行 | 单行 `nowrap`，实测宽 1128~3949px，被裁到只剩前 1/3 | 允许换行，内容完整 |
| 代码块字号 | 11px | 13px |
| 会话行高 | 32px | 40px |
| 视口高度 | `height:100%`，底部被浏览器工具栏盖住 | `100dvh`，并随软键盘收缩 |
| 正文字号 | 14px | 15px（输入区 16px，顺带避免 iOS 聚焦缩放） |

**桌面宽度下完全不激活**：所有规则都挂在 `html[data-dsh-mobile]` 之下，
并且不会留下任何属性残留。

## 安装

```bash
dsh plugin --profile web add dsh-mobile-adapt
```

然后重启 dsh：

```bash
systemctl restart deepseek-harness   # 服务名按你的实际部署调整
```

包内声明了 `dsh.bundle.patch`，所以 `dsh plugin add` 会自动把它挂进 profile 的
bundle 栈，**不需要手工改 `cordis.patch.yml`**。

<details>
<summary>手动安装（不经过 npm）</summary>

```bash
cd <DSH_HOME>/profiles/web/node_modules
git clone https://github.com/YOUR_GITHUB_USERNAME/dsh-mobile-adapt.git
```

然后在 `profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: mobile-adapt
      name: 'dsh-mobile-adapt'
```

重启 dsh。

</details>

## 适配内容

- **布局**：三列压成单列，内容占满视口
- **侧边栏**：`position: fixed` 覆盖式抽屉（86vw，上限 340px），带遮罩；
  点左上角按钮或从屏幕左缘右滑打开，点遮罩或左滑关闭
- **视口**：改用 `100dvh`，并监听 `visualViewport` 把软键盘高度让给应用框架
- **输入**：输入区字号 16px（避免 iOS 聚焦时缩放整页）
- **可读性**：正文 15px；代码块内部横向滚动、宽表格内部滚动、长链接换行
- **触控**：会话头部 / 输入区 / 侧边栏按钮 ≥40px，列表行 40px，
  `touch-action: manipulation` 去掉 300ms 点击延迟
- **安全区**：补上 `viewport-fit=cover`，抽屉、输入区、会话头部让出 `safe-area-inset-*`
- **设置页**：桌面两栏对话框折叠成单栏，导航栏变顶部横向滚动条

## 为什么不能只写几个 media query

踩过才知道的三个结构性原因：

1. **布局宽度不是 CSS 写的**。AppFrame 用 JS 求解列宽，直接内联成
   `style="grid-template-columns: ..."`。要覆盖它，只能用 `!important`。
2. **类名是 CSS-module 哈希**（形如 `pI_x6G_frame`、`wSkVaW_header`），跨版本就变。
   本插件因此**只依赖公开的 `data-slot` 锚点**和 `data-composer-*` /
   `data-conversation-*` 这类稳定属性，一个哈希类名都没有用。
3. **slot host 是 `display: contents`**。真正的网格列是它**向上第一个
   `display !== contents` 的祖先**。而且在 `contents` 元素上写 `overflow` /
   `max-width` 是**完全无效**的——这点很容易误判为"改了没生效"。

另外两个具体的坑写在 [CHANGELOG](CHANGELOG.md) 里：
抽屉脱离 grid 流后自动放置会错位（要显式钉住 `grid-column`），
以及折叠摘要行是 inline 元素、`max-width` 对它无效。

## 它不接管 DSH 的状态

抽屉的开关状态**不自己维护**：读 AppFrame 的 `data-sidebar-collapsed` 属性判断，
切换时调 `ctx.layout.toggleSidebar()`，让 DSH 自己改状态。所以不会出现
"插件的状态和壳的状态不一致"。

## 开发

```bash
npm run build     # src/ → lib/
```

- `src/mobile.css` —— 全部样式
- `src/client.js` —— 浏览器端逻辑（构建时把 CSS 注入到 `__MOBILE_CSS__` 占位符）
- `lib/client.js` —— 构建产物，**DSH 直接加载的就是它**（已提交，装包即用）

对 DSH 客户端插件的格式说明：产物必须是 lazy-CJS 形式
（`window.__ModuleLoader__.load({ id, factory })`，在 `exports` 上挂 `apply` / `inject`），
宿主只负责把它作为 bundle 提供给浏览器。

## 已知限制

- **第三方插件自己的按钮不放大**。例如 dsh-better-sidebar 的 28px 图标按钮不在
  适配范围内——强行放大会破坏它自己的工具栏布局。
- **手机首次加载仍然慢**。首屏要下载数 MB 的插件 bundle，这不归本插件管。
- **手机上的右侧栏没有专门适配**。DSH 的列求解器在窄屏本就不给它轨道，
  走的是 occupant 自己的全屏呈现。
- **PWA / 添加到主屏**需要服务端配合（manifest 与 iOS 的 `apple-touch-icon` 必须在
  静态 HTML 里，客户端注入不可靠），不属于本插件的能力范围。

## 协议

[MIT](LICENSE)
