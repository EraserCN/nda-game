# 《NDA：神经折旧管理局》（Neural Deprecation Agency）

> **“痛苦是未被优化的生产力漏洞；遗忘是最高等级的员工福利。”**  
> 一款复古未来主义 × 《黑镜》现实讽刺的沉浸式网页解谜游戏。

**游戏作者与系统架构：@EraserCN**

---

## 📺 游戏特色与技术特性

1. **纯正复古未来主义（Retro-Futurism）**
   - 模拟 1980 年代军工/科研级绿磷光 CRT 终端机（MODEL-88）。
   - 带有扫描线（Scanlines）、晕影（Vignette）、球形畸变与余辉效果。
   - **支持物理级 CRT 开关**：面板右上角配有物理按键 `CRT FX: ON/OFF`（或按键盘快捷键 `C` 随时切换），关闭后呈现高对比度极简黑客界面。

2. **零境外外链依赖（国内网络友好，秒级加载）**
   - 不加载任何 Google Fonts、cdnjs、unpkg、npm CDN 等外链资源。
   - 采用系统原生等宽字体栈与 SVG/Canvas 本地渲染。
   - **Web Audio API 纯原生合成音效**：键盘机械敲击音、CRT 阳极高频自激声、磁带粉红噪音底噪（Pink Noise）、和弦提示音全部由浏览器运行时实时正弦波/方波合成，无需外挂几兆音频文件。

3. **《黑镜》式现实讽刺核心**
   - 讽刺现代社会的**情绪稳定规训**、**零工经济异化**与**特权阶级记忆洗白**。
   - 三幕渐进式叙事与三大核心解谜机制：
     - **波形手术刀（Waveform Scalpel）**：调谐频域滑块消解情绪峰值；
     - **微缩档案复核（Contradiction Audit）**：戳破企业主管篡改日志的谎言；
     - **认知残渣图灵质询（Persona Query）**：在终端通过自然语言关键词击溃意识切片的心理防线；
     - **终极反转与多结局抉择**：发现审查员自身的残酷真相，决定自我格式化、神经雪崩或化身幽灵协议。

---

## 🚀 GitHub Pages 一键部署教程

本项目为纯静态单页架构（包含 `index.html`、`style.css`、`game.js`），无需任何 Node.js 构建步骤，开箱即用：

### 部署方法：

1. **新建 GitHub 仓库**：
   在 GitHub 上新建一个仓库（例如命名为 `nda-terminal` 或 `nda-game`）。

2. **推送本项目代码到仓库**：
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of NDA game by @EraserCN"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
   git push -u origin main
   ```

3. **开启 GitHub Pages**：
   - 进入 GitHub 仓库页面的 **Settings** -> **Pages**。
   - 在 **Build and deployment** 下的 **Branch** 选择 `main` 分支，路径选择 `/ (root)`。
   - 点击 **Save**。
   - 等待约 30 秒至 1 分钟，GitHub 将生成专属公开网址：  
     `https://<你的用户名>.github.io/<你的仓库名>/`

4. **打开即玩**：任何人无需翻墙即可流畅体验所有音画效果。

---

## ⌨️ 快捷键与指令参考

| 快捷键 / 指令 | 作用 |
| :--- | :--- |
| `C` 键 或 面板开关 | 切换 CRT 滤镜与扫描线效果 |
| `M` 键 或 面板开关 | 切换蜂鸣器与磁带底噪系统 |
| `HELP` | 展开操作手册与岗前培训规范 |
| `QUERY [关键词]` | 在第二关质询意识碎片（如 `QUERY 记者`、`QUERY 刹车`） |
| `STATUS` | 查看当前审查进度、信用分与共情偏离指数 |
| `WHOAMI` | 显示终端硬件与署名作者（@EraserCN） |
| `CLEAR` | 刷新当前工作台视图 |
| `RELOAD` | 重启终端回到引导系统 |

---

## 📜 版权与作者

- **游戏设计与制作**：@EraserCN
- **协议**：MIT License
