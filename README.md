# MyChat 项目

一个基于 React + TypeScript + Go + Gin + MySQL + Redis 的AI聊天应用。

## 项目结构

```
MyChat/
├── front/            # 前端项目（React + TypeScript）
│   ├── public/       # 静态资源
│   ├── src/          # 源代码
│   ├── .env          # 前端环境变量（本地开发用）
│   ├── package.json  # 前端依赖配置
│   └── vite.config.ts # Vite 配置
├── server/           # 后端项目（Go + Gin）
│   ├── cache/        # 缓存相关代码
│   ├── config/       # 配置相关代码
│   ├── controller/   # 控制器
│   ├── dto/          # 数据传输对象
│   ├── middleware/   # 中间件
│   ├── model/        # 数据模型
│   ├── router/       # 路由配置
│   ├── services/     # 服务层
│   ├── utils/        # 工具函数
│   ├── .env          # 后端环境变量（本地开发用）
│   ├── go.mod        # Go 模块配置
│   └── main.go       # 后端入口文件
├── .gitignore        # Git 忽略文件配置
└── README.md         # 项目说明文档
```

## 技术栈

### 前端
- React 19+
- TypeScript
- Vite
- Ant Design
- Zustand（状态管理）
- Axios（HTTP 客户端）

### 后端
- Go 1.20+
- Gin（Web 框架）
- GORM（ORM 框架）
- MySQL（数据库）
- Redis（缓存）
- JWT（认证）

## 功能特性

- ✅ 用户认证（登录/注册）
- ✅ 对话管理（创建/删除对话）
- ✅ 消息管理（发送/接收/删除消息）
- ✅ AI 智能回复
- ✅ 流式响应（SSE）
- ✅ Markdown 支持
- ✅ 代码高亮
- ✅ 数学公式支持
- ✅ 深度思考模式
- ✅ 响应式设计（支持移动端）


## 环境要求

### 前端
- Node.js 16+
- pnpm 7+

### 后端
- Go 1.20+
- MySQL 8.0+
- Redis 7.0+

## 本地开发

### 前端开发

1. 进入前端目录
```bash
cd front
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm dev
```

### 后端开发

1. 进入后端目录
```bash
cd server
```

2. 安装依赖
```bash
go mod tidy
```

3. 启动后端服务器
```bash
go run main.go
```

## 上传 GitHub 指南

### 1. 准备工作

1. **创建 GitHub 仓库**：在 GitHub 上创建一个新的仓库

2. **配置 .gitignore 文件**：确保项目根目录有 `.gitignore` 文件，忽略敏感信息和构建产物

3. **处理敏感信息**：
   - 确保 `.env` 文件被添加到 `.gitignore` 中
   - 不要将真实的 API 密钥、数据库密码等敏感信息提交到仓库

### 2. 初始化 Git 仓库

```bash
# 进入项目根目录
cd MyChat

# 初始化 Git 仓库
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/your-repo-name.git
```

### 3. 提交代码

```bash
# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 推送到 GitHub
git push -u origin main
```

### 4. 分支管理

建议使用以下分支策略：

- `main`：主分支，用于发布稳定版本
- `dev`：开发分支，用于集成新功能
- `feature/*`：特性分支，用于开发具体功能
- `bugfix/*`：修复分支，用于修复 bug

### 5. 标签管理

使用标签管理版本：

```bash
# 创建标签
git tag v1.0.0

# 推送到 GitHub
git push origin v1.0.0
```

## 部署指南

### 前端部署

1. 构建生产版本
```bash
cd front
pnpm run build
```

2. 将 `dist` 目录部署到静态文件服务器或 CDN

### 后端部署

1. 构建可执行文件
```bash
cd server
go build -o mychat-server main.go
```

2. 部署到服务器并启动


## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件