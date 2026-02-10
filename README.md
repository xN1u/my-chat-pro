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
- ✅ 上下文缓存
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

3. 配置.env

4. 启动开发服务器
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

3. 配置.env

4. 启动后端服务器
```bash
go run main.go
```

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
