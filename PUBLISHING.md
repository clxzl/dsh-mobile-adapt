# 发布指引

这个仓库已经是可发布状态（`lib/client.js` 是构建产物且已提交，装包即用）。
下面是从零到发出去的完整步骤。

## 0. 先把占位符换掉

`package.json` 里有 **3 处** `YOUR_GITHUB_USERNAME`（`repository` / `homepage` / `bugs`）。

Git Bash：

```bash
sed -i 's/YOUR_GITHUB_USERNAME/你的GitHub用户名/g' package.json
```

或者直接用编辑器改这 3 处。

顺手确认 `author` 字段（现在是 `HuangFei`）符合你的预期。

## 1. 推到 GitHub

先在 GitHub 网页上**新建一个空仓库**，名字 `dsh-mobile-adapt`。

> ⚠️ 建仓库时**不要**勾选 "Add a README / .gitignore / license" ——
> 本地已经有这些文件了，勾了会制造一次无意义的冲突。

然后：

```bash
git remote add origin https://github.com/<你的用户名>/dsh-mobile-adapt.git
git push -u origin main
```

## 2. 发到 npm

### 方式 A：自动发布（推荐，已配好）

仓库里有两个 workflow：

| 文件 | 触发 | 作用 |
|---|---|---|
| `.github/workflows/ci.yml` | push 到 main / PR | 重建 `lib/` 并校验它与 `src/` 同步；断言 bundle 的加载器契约；校验 package 元数据 |
| `.github/workflows/release.yml` | push `v*` tag | 校验 tag 与 `package.json` 版本一致 → `npm publish --provenance` → 创建 GitHub Release |

**一次性配置**（建一个 npm token 给 CI 用）：

1. 到 https://www.npmjs.com/settings/~/tokens 建一个 **Automation** 类型的 token
   （Automation token 不受 2FA 交互限制，适合跑在 CI 里）
2. 存进仓库 secret：

   ```bash
   gh secret set NPM_TOKEN --repo clxzl/dsh-mobile-adapt
   # 提示时粘贴 token，回车
   ```

**之后每次发布**：

```bash
npm run build                               # lib/ 必须与 src/ 同步提交
# 改 package.json 的 version，并在 CHANGELOG.md 加一节
npm version 1.1.1 --no-git-tag-version      # 只改 package.json，不自动打 tag
git add -A && git commit -m "chore: release v1.1.1"
git tag v1.1.1
git push && git push --tags
```

推送 tag 后 CI 自动完成发布和 Release。

> **这两道校验是有意加的**：tag 与版本不一致、或 `lib/` 忘了重新构建，
> 都会让 npm 上出现一个和源码对不上的包 —— 而版本一旦发出去，就只能靠发新版本补救。

> **更安全的替代**：npm 支持 [Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
> （OIDC，不需要长期 token）。等这个包在 npm 上存在之后，可以在包的设置页把
> `clxzl/dsh-mobile-adapt` + `release.yml` 登记为可信发布者，然后删掉上面的 `NPM_TOKEN`。
> workflow 里的 `id-token: write` 权限已经备好了。

### 方式 B：手动发布

```bash
npm login
npm publish --access public
```

发布前先看一眼会打包哪些文件：

```bash
npm pack --dry-run
```

预期包含：`lib/`、`src/`、`build.mjs`、`cordis.patch.yml`、`docs/`（截图）、
几个 README、CHANGELOG、LICENSE。

> 包名 `dsh-mobile-adapt` 目前未被占用（发之前用 `npm view @clxzl/dsh-mobile-adapt` 再确认一次）。
> 如果已被占用，改 `package.json` 的 `name` 即可，别忘了一并改 `cordis.patch.yml` 里的
> `name:` 字段——两处必须一致。

## 3. 别人怎么装

```bash
dsh plugin --profile web add @clxzl/dsh-mobile-adapt
```

然后重启 dsh。包内声明了 `dsh.bundle.patch`，`dsh plugin add` 会自动把它挂进 profile 的
bundle 栈，使用者不需要手改任何配置文件。

## 4. 版本升级流程

```bash
# 1) 改 src/ 下的源码
# 2) 重新构建（lib/client.js 必须同步更新，它是要提交的）
npm run build

# 3) 改 package.json 的 version，并在 CHANGELOG.md 加一节
# 4) 提交并打 tag
git add -A
git commit -m "fix: ..."
git tag v1.1.1
git push && git push --tags

# 5) 发布
npm publish
```

> `lib/client.js` 是**要提交**的构建产物——DSH 直接加载它，使用者装包后不应该还需要跑构建。

## 5. 提交到插件市场（可选）

社区几个市场会自动扫描 npm 上的 dsh 插件。如果有收录申请入口，按它们的说明提交即可。

## 检查清单

- [ ] `package.json` 里 3 处 `YOUR_GITHUB_USERNAME` 已替换
- [ ] `npm run build` 之后 `git status` 是干净的（说明构建产物已同步提交）
- [ ] `npm pack --dry-run` 的文件列表符合预期
- [ ] 在干净环境试装一次：`dsh plugin --profile web add @clxzl/dsh-mobile-adapt`
- [ ] 桌面端打开确认**没有**被影响（所有规则都 gate 在 `html[data-dsh-mobile]` 下）
