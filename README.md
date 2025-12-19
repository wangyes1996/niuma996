# 数字资产管理系统

一个基于 Next.js 和 MUI 的现代化数字资产管理平台，集成了币安 API、AI 市场分析和技术指标计算功能。

## 功能特性

### 📊 账户概览
- 实时显示币安合约账户余额信息
- 总保证金余额、总钱包余额、未实现盈亏、可用余额
- 10秒自动刷新数据

### 📈 持仓管理
- 实时展示当前持仓情况
- 交易对、持仓数量、入场价格、标记价格
- 未实现盈亏可视化（绿色盈利，红色亏损）
- 杠杆倍数和保证金类型显示

### 🤖 AI 市场分析
- 基于 Mastra AI 的实时市场分析
- 支持 Markdown 格式的分析结果展示
- 实时流式输出分析过程
- 代码块、引用、列表等格式美化

### 📉 技术指标
- 集成 TA-Lib 和 technicalindicators 库
- 支持多种技术指标计算
- 可扩展的指标系统

## 技术栈

### 前端
- **Next.js 16.0.8** - React 框架
- **MUI 7.3.6** - UI 组件库
- **React 19.2.1** - 前端框架
- **TypeScript** - 类型安全
- **Sass** - CSS 预处理器

### 后端
- **Node.js** - 运行时
- **Next.js API Routes** - API 服务
- **币安 API** - 数据来源
- **Mastra AI** - AI 分析引擎
- **OpenAI** - 大模型支持

### 工具链
- **pnpm** - 包管理器
- **ESLint** - 代码质量检查
- **TypeScript** - 类型检查

## 项目结构

```
├── public/              # 静态资源
│   └── crypto-indicators.mcp  # MCP 协议文件
├── src/
│   ├── app/
│   │   ├── api/        # API 路由
│   │   │   ├── ai/     # AI 分析接口
│   │   │   ├── binance/ # 币安 API 接口
│   │   │   ├── crypto/ # 技术指标接口
│   │   │   └── mcp/    # MCP 协议接口
│   │   ├── page.tsx    # 首页
│   │   ├── layout.tsx  # 布局
│   │   └── globals.scss # 全局样式
│   ├── mcp/            # MCP 服务器
│   └── types/          # 类型定义
├── .env.example        # 环境变量示例
├── package.json        # 项目配置
└── tsconfig.json       # TypeScript 配置
```

## 安装与运行

### 环境要求
- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# 币安 API 密钥
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key

# AI 配置
OPENAI_API_KEY=your_openai_key
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 生产构建

```bash
pnpm build
pnpm start
```

## API 接口

### 币安账户信息

```
GET /api/binance/account
```

返回账户余额和持仓信息。

### AI 市场分析

```
GET /api/ai/mastra-analysis-ws?symbol=BTC
```

返回实时流式 AI 分析结果。

### 技术指标

```
GET /api/crypto/indicators?symbol=BTC
```

返回技术指标计算结果。

## 使用说明

### 1. 配置币安 API

在币安官网创建 API 密钥，开启合约权限，然后配置到 `.env` 文件中。

### 2. 查看账户信息

首页会自动显示账户概览和持仓情况，数据每 10 秒刷新一次。

### 3. 运行 AI 分析

点击「开始分析」按钮，系统会调用 AI 进行市场分析，并实时展示分析过程。

### 4. 技术指标计算

通过 API 接口调用技术指标计算功能，支持多种指标类型。

## 注意事项

1. **API 安全**：币安 API 密钥具有资金操作权限，请妥善保管，不要泄露。
2. **风险提示**：数字货币交易存在高风险，请谨慎操作。
3. **数据延迟**：实时数据可能存在一定延迟，请以币安官网数据为准。
4. **AI 分析**：AI 分析结果仅供参考，不构成投资建议。

## 开发计划

- [ ] 添加交易历史记录
- [ ] 支持多账户管理
- [ ] 自定义技术指标
- [ ] 交易策略回测
- [ ] 移动端适配

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**免责声明**：本项目仅供学习和研究使用，不构成任何投资建议。使用本项目产生的任何风险由用户自行承担。