# SmartCool AI – Backend API

Node.js 20+ · Express 5 · TypeScript · Prisma 7 · PostgreSQL · JWT (access + refresh token) · Zod

## Chạy nhanh (Windows)

1. Có PostgreSQL đang chạy (xem [docs/DATABASE_SERVER.md](../docs/DATABASE_SERVER.md)).
2. Bấm đúp `backend/CHAY-BACKEND.cmd` (lần đầu nó tạo `.env`, sửa xong chạy lại).
3. Mở http://localhost:5000/api/health → thấy `"database": {"status": "connected"}` là xong.

Hoặc chạy lệnh tay:

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm install                 # tự chạy prisma generate
npm run db:deploy           # tạo bảng (prisma migrate deploy)
npm run db:seed             # dữ liệu mẫu
npm run dev                 # http://localhost:5000
npm run test:api            # (cửa sổ khác) kiểm tra 88 bước API
```

Tài khoản mẫu: **admin@smartcool.vn / Admin@123456** (ADMIN) · **demo@smartcool.vn / Demo@123456** (USER)

## Cấu trúc thư mục (phân lớp)

```
backend/
├─ prisma/
│  ├─ schema.prisma        # 14 bảng (Model)
│  ├─ migrations/          # lịch sử thay đổi DB
│  └─ seed.ts              # dữ liệu mẫu
├─ src/
│  ├─ server.ts            # khởi động server + kết nối DB
│  ├─ app.ts               # gắn middleware + routes
│  ├─ config/              # database.ts (Prisma), auth.ts (cấu hình JWT)
│  ├─ routes/              # URL → controller (+ middleware phân quyền)
│  ├─ middlewares/         # requireAuth, optionalAuth, requireAdmin
│  ├─ controllers/         # nhận request, trả JSON (mỏng)
│  ├─ validators/          # schema Zod kiểm tra dữ liệu vào
│  ├─ services/            # nghiệp vụ + truy vấn Prisma (CRUD nằm ở đây)
│  └─ utils/               # token.ts (JWT), password.ts (bcrypt), http.ts
└─ scripts/smoke-test.mjs  # test toàn bộ API
```

## Danh sách API

Mọi response có dạng `{ "success": true, "data": ... }` hoặc `{ "success": false, "message": "..." }`.
API cần đăng nhập gửi header `Authorization: Bearer <accessToken>`.

| Nhóm | Method & URL | Quyền | Mô tả |
|---|---|---|---|
| Hệ thống | `GET /api/health` | Công khai | Kiểm tra server + DB |
| Auth | `POST /api/auth/register` | Công khai | Đăng ký → trả access + refresh token |
| | `POST /api/auth/login` | Công khai | Đăng nhập |
| | `POST /api/auth/refresh` | Công khai | Đổi refresh token lấy token mới (xoay vòng) |
| | `POST /api/auth/logout` | Công khai | Thu hồi refresh token hiện tại |
| | `POST /api/auth/logout-all` | Đăng nhập | Đăng xuất mọi thiết bị |
| | `GET /api/auth/me` | Đăng nhập | Thông tin tài khoản |
| | `PATCH /api/auth/profile` | Đăng nhập | Sửa hồ sơ |
| Thương hiệu | `GET /api/brands`, `GET /api/brands/:id` | Công khai | Xem |
| | `POST` / `PATCH /:id` / `DELETE /:id` | ADMIN | Thêm / sửa / xóa |
| Sản phẩm | `GET /api/products?q=&deviceType=&brand=&inverter=&minPrice=&maxPrice=&sort=&page=&limit=` | Công khai | Tìm kiếm, lọc, phân trang |
| | `GET /api/products/:id` | Công khai | Chi tiết |
| | `POST` / `PATCH /:id` / `DELETE /:id[?hard=true]` | ADMIN | Thêm / sửa / xóa mềm (hoặc xóa hẳn) |
| Bài viết | `GET /api/articles?q=&category=&guide=&tag=` | Công khai | Danh sách bài đã xuất bản |
| | `GET /api/articles/:idOrSlug` | Công khai | Chi tiết |
| | `POST` / `PATCH /:id` / `DELETE /:id` | ADMIN | Thêm / sửa / xóa |
| | `POST` / `DELETE /api/articles/:id/favorite` | Đăng nhập | Thêm / bỏ yêu thích |
| | `GET /api/articles/me/favorites` | Đăng nhập | Bài yêu thích |
| | `PUT /api/articles/:id/progress` | Đăng nhập | Lưu tiến độ hướng dẫn `{ completedSteps: [...] }` |
| | `GET /api/articles/me/progress` | Đăng nhập | Tiến độ của tôi |
| Chẩn đoán | `POST /api/diagnoses/analyze` | Công khai | Phân tích thử, không lưu |
| | `GET` / `POST /api/diagnoses`, `GET` / `PATCH` / `DELETE /api/diagnoses/:id` | Đăng nhập (chỉ của mình) | CRUD phiếu chẩn đoán |
| Dự toán | `GET` / `POST /api/estimates`, `GET` / `PATCH` / `DELETE /api/estimates/:id` | Đăng nhập (chỉ của mình) | CRUD, server tự tính tổng |
| So sánh | `GET` / `POST /api/comparisons`, `GET` / `DELETE /api/comparisons/:id` | Đăng nhập (chỉ của mình) | So sánh 2 sản phẩm, chấm điểm |
| Hội thoại | `GET` / `POST /api/conversations`, `GET` / `PATCH` / `DELETE /:id`, `POST /:id/messages` | Đăng nhập | Lịch sử chat AI |
| Google | `GET /api/auth/google/config` | Công khai | Server đã bật Google chưa, Client ID |
| | `POST /api/auth/google` `{ idToken }` | Công khai | Đăng nhập bằng Google → trả JWT như login thường |
| Khách hàng | `GET /api/me/devices`, `GET`/`POST /api/me/tickets`, `GET /api/me/notifications`, `PATCH /api/me/notifications/:id/read` | Đăng nhập | Thiết bị, yêu cầu sửa chữa, hộp thư của tôi |
| Quản trị | `GET /api/admin/me` | Nhân viên | Vai trò + danh sách quyền (để vẽ menu) |
| | `GET /api/admin/dashboard`, `/stats` | dashboard:read | KPI, biểu đồ, cảnh báo khẩn |
| | `GET`/`POST /api/admin/devices`, `GET`/`PATCH`/`DELETE /:id`, `POST /:id/simulate` | devices:read / write | Thiết bị IoT (Serial/MAC), giả lập lỗi |
| | `GET`/`POST /api/admin/error-codes`, `PATCH`/`DELETE /:id` | catalog:write | Bảng mã lỗi + cách khắc phục |
| | `GET`/`POST /api/admin/firmware`, `DELETE /:id`, `GET /:id/rollouts`, `POST /:id/rollout` | firmware:write | Phát hành firmware, đẩy OTA, theo dõi thành công/lỗi |
| | `GET`/`POST /api/admin/tickets`, `GET`/`PATCH`/`DELETE /:id` | tickets:read / write / work | Phiếu dịch vụ: tiếp nhận, gán KTV, tiến độ, vật tư |
| | `GET`/`PUT /api/admin/maintenance/rules`, `GET /maintenance/due`, `POST /maintenance/run` | tickets / settings | Bảo trì định kỳ, gửi nhắc |
| | `GET /api/admin/users`, `GET /:id`, `PATCH /:id/status`, `/:id/role`, `/:id/staff-profile`, `GET /technicians` | users:read / write | Khách hàng, nhân viên, phân quyền |
| | `GET`/`POST /api/admin/notifications`, `DELETE /:id` | notifications:write | Thông báo đẩy theo đối tượng, hẹn giờ |
| | `GET`/`PUT /api/admin/settings` | settings:write | Ngưỡng cảnh báo, quy tắc tự động, bảo hành |
| | `GET /api/admin/audit-logs` | audit:read | Nhật ký ai làm gì, lúc nào |

Giao diện quản trị: mở `http://localhost:5000/admin` (file tĩnh trong `public/admin/`).

### Ví dụ

```bash
# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@smartcool.vn","password":"Demo@123456"}'

# Tạo dự toán lắp máy lạnh (thay TOKEN và PRODUCT_ID)
curl -X POST http://localhost:5000/api/estimates -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"deviceType":"AIR_CONDITIONER","serviceType":"INSTALLATION","productId":"PRODUCT_ID","budget":15000000,
       "items":[{"name":"Ống đồng","quantity":5,"unitPrice":180000}]}'
```

## Lệnh database

| Lệnh | Tác dụng |
|---|---|
| `npm run db:migrate` | Sửa `schema.prisma` xong → tạo migration mới (máy dev) |
| `npm run db:deploy` | Áp migration lên DB (server/Neon) |
| `npm run db:seed` | Nạp dữ liệu mẫu (chạy lại được nhiều lần) |
| `npm run db:reset` | Xóa sạch DB, tạo lại bảng, seed lại |
| `npm run db:studio` | Mở giao diện xem/sửa dữ liệu (Prisma Studio) |
