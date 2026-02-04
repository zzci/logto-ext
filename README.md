# Logto Authentication Service

使用 Logto Management API 实现用户登录验证的 Bun 服务。

## 功能

- 支持用户名或邮箱登录
- 通过 Logto Management API 验证用户密码
- 自动检测输入是邮箱还是用户名

## 前置要求

1. Logto 实例（Cloud 或自托管）
2. 在 Logto Console 中创建 Machine-to-Machine (M2M) 应用
3. 为 M2M 应用分配 Management API 访问权限

## 安装

```bash
bun install
```

## 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

配置项说明：

| 变量 | 说明 |
|------|------|
| `LOGTO_ENDPOINT` | Logto 租户端点，如 `https://your-tenant.logto.app` |
| `LOGTO_M2M_APP_ID` | M2M 应用的 App ID |
| `LOGTO_M2M_APP_SECRET` | M2M 应用的 App Secret |
| `PORT` | 服务端口，默认 3000 |

### 在 Logto Console 中创建 M2M 应用

1. 登录 Logto Console
2. 进入 Applications
3. 点击 "Create application"
4. 选择 "Machine-to-machine"
5. 在 API resources 中勾选 "Logto Management API"
6. 复制 App ID 和 App Secret

## 运行

```bash
# 开发模式（热重载）
bun dev

# 生产模式
bun start
```

## API 接口

### POST /login

验证用户凭证。

**请求体：**

```json
{
  "username": "用户名或邮箱",
  "password": "密码"
}
```

**响应：**

成功 (200):
```json
{
  "success": true,
  "message": "Login successful",
  "userId": "user-id"
}
```

失败 - 缺少参数 (400):
```json
{
  "success": false,
  "message": "Missing username or password"
}
```

失败 - 凭证无效 (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### GET /health

健康检查接口。

**响应 (200):**
```json
{
  "status": "ok"
}
```

## 示例

```bash
# 使用用户名登录
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# 使用邮箱登录
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "password123"}'
```

## 工作原理

1. 接收包含 `username` 和 `password` 的 POST 请求
2. 检测 `username` 是邮箱格式还是普通用户名
3. 使用 Logto Management API 搜索用户：
   - 邮箱：`GET /api/users?search.primaryEmail={email}&mode.primaryEmail=exact`
   - 用户名：`GET /api/users?search.username={username}&mode.username=exact`
4. 如果找到用户，调用密码验证 API：
   - `POST /api/users/{userId}/password/verify`
5. 根据验证结果返回相应的 HTTP 状态码
