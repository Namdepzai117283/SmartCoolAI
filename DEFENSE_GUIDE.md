# Hướng dẫn bảo vệ đồ án – SmartCool AI (phần Backend + Database)

Tài liệu này để ôn trước khi thầy hỏi. Mỗi mục có: **câu hỏi thường gặp → trả lời ngắn → mở file nào để chỉ**.

---

## 1. Kiến trúc tổng thể

```
 App điện thoại (Expo)  ─┐
 Web (React/Vite)       ─┼──HTTP/JSON──▶  Backend Express  ──Prisma──▶  PostgreSQL
                         │   + JWT         (Node.js/TS)                   (14 bảng)
                         └─(sau này) LM Studio qua backend
```

- **Client** chỉ lo giao diện, gọi API qua `fetch` và gửi `Authorization: Bearer <token>`.
- **Backend** lo xác thực, kiểm tra dữ liệu, nghiệp vụ, lưu DB.
- **Database** PostgreSQL, truy cập qua **Prisma ORM** (không viết SQL tay, chống SQL Injection).

## 2. Backend chia lớp thế nào? (câu hay hỏi nhất)

> "Em dùng mô hình phân lớp giống MVC: **Route → Middleware → Controller → Service → Model (Prisma) → Database**."

| Lớp | Thư mục | Nhiệm vụ | Ví dụ |
|---|---|---|---|
| Route | `backend/src/routes/` | Khai báo URL, method, gắn middleware | `estimate.routes.ts` |
| Middleware | `backend/src/middlewares/` | Kiểm tra JWT, phân quyền | `requireAuth`, `requireAdmin` |
| Controller | `backend/src/controllers/` | Lấy dữ liệu từ `req`, gọi service, trả JSON | `estimate.controller.ts` |
| Validator | `backend/src/validators/` | Luật kiểm tra dữ liệu (Zod) | `estimate.validator.ts` |
| Service | `backend/src/services/` | **Nghiệp vụ + CRUD** với Prisma | `estimate.service.ts` |
| Model | `backend/prisma/schema.prisma` | Định nghĩa bảng, quan hệ | `model CostEstimate` |

**Vì sao tách?** Controller không biết DB, Service không biết HTTP → dễ sửa, dễ test, đổi client (web/app) không phải sửa nghiệp vụ.

> "View" trong MVC ở đây là **app điện thoại / web** – backend chỉ trả JSON (REST API).

## 3. Luồng một request (vẽ lên bảng được)

Ví dụ người dùng bấm **"Lưu dự toán"** trên app:

1. **UI** gọi `POST /api/estimates` kèm `Authorization: Bearer eyJ...` và JSON body.
2. **app.ts** → `app.use('/api/estimates', estimateRoutes)`.
3. **Route** `estimate.routes.ts` → chạy `requireAuth` trước.
4. **Middleware** `auth.middleware.ts`: tách token → `jwt.verify` (chữ ký + hạn 15 phút) → tra DB xem user còn ACTIVE → gắn `req.user`.
5. **Controller** `estimate.controller.ts`: `estimateService.create(userId, req.body)`.
6. **Service** `estimate.service.ts`: Zod kiểm tra body → lấy giá sản phẩm từ DB → `calculateCost()` → `prisma.costEstimate.create()`.
7. **Prisma** sinh câu `INSERT INTO cost_estimates ...` → PostgreSQL.
8. Trả về `201 { success: true, data: {...} }` → app hiển thị.

Lỗi ở bước nào thì trả mã tương ứng: 400 (dữ liệu sai), 401 (chưa đăng nhập/token hết hạn), 403 (không đủ quyền), 404 (không có hoặc không phải của mình), 409 (trùng/đang được dùng).

## 4. CRUD nằm ở đâu?

| Bảng | Create | Read | Update | Delete | File |
|---|---|---|---|---|---|
| `products` | ADMIN | Công khai, có lọc/tìm/phân trang | ADMIN | ADMIN (xóa mềm) | `services/product.service.ts` |
| `brands` | ADMIN | Công khai | ADMIN | ADMIN (chặn nếu còn sản phẩm) | `services/brand.service.ts` |
| `knowledge_articles` | ADMIN | Công khai | ADMIN | ADMIN | `services/article.service.ts` |
| `diagnoses` | User | Chỉ của mình | User | User | `services/diagnosis.service.ts` |
| `cost_estimates` | User | Chỉ của mình | User (tính lại tổng) | User | `services/estimate.service.ts` |
| `comparisons` | User | Chỉ của mình | – | User | `services/comparison.service.ts` |
| `conversations` + `messages` | User | Chỉ của mình | User | User | `services/conversation.service.ts` |
| `users` | Đăng ký | `/auth/me` | Hồ sơ / ADMIN khóa | – | `auth.service.ts`, `admin.service.ts` |

**"Chỉ của mình" làm sao?** Mọi truy vấn đều có `where: { id, userId }` – lấy `userId` từ token, không lấy từ client. Người khác gọi đúng ID cũng nhận 404.

**Xóa mềm là gì?** `DELETE /api/products/:id` chỉ đặt `isActive = false`, vì sản phẩm có thể đang nằm trong lịch sử so sánh/dự toán của người dùng (khóa ngoại `onDelete: Restrict`). `?hard=true` mới xóa hẳn.

## 5. Đăng nhập & JWT

- **Đăng ký**: mật khẩu băm bằng **bcrypt** (12 rounds) → lưu `password_hash`, không bao giờ lưu mật khẩu gốc. (`utils/password.ts`)
- **Đăng nhập** trả 2 token (`utils/token.ts`):
  - **Access token** (JWT, HS256, sống **15 phút**) chứa `sub = userId`, `role`. Gửi kèm mọi request.
  - **Refresh token** (chuỗi ngẫu nhiên 64 byte, sống 30 ngày). DB chỉ lưu **SHA-256** của nó (bảng `refresh_tokens`).
- **Hết 15 phút** → app gọi `POST /api/auth/refresh` → server thu hồi token cũ, cấp cặp mới (**xoay vòng**). Mỗi refresh token chỉ dùng được **một lần**: dùng lại token đã thu hồi → 401.
- **Đăng xuất**: đánh dấu `revoked_at` cho refresh token.
- **Phân quyền (RBAC)**: `requirePermission('tickets:write')` trong `auth.middleware.ts` – **lấy role trong DB**, không tin role trong token (đổi quyền có hiệu lực ngay). Bảng vai trò → quyền ở `src/config/permissions.ts`:
  | Vai trò | Được làm |
  |---|---|
  | Super Admin | Tất cả |
  | Quản lý kho/kỹ thuật | Model, mã lỗi, thiết bị, firmware/OTA, xem phiếu |
  | CSKH | Khách hàng, tạo/điều phối phiếu, thông báo, tài liệu |
  | Kỹ thuật viên | Chỉ thấy và cập nhật **phiếu được gán cho mình** (không đổi người nhận, mức ưu tiên) |
  | Khách hàng | Chỉ API `/api/me/*`, bị chặn khỏi `/admin` |
- **Đăng nhập Google** (`auth.service.ts → loginWithGoogle`): web lấy `id_token` từ Google → server dùng `google-auth-library` kiểm tra chữ ký, `aud` = `GOOGLE_CLIENT_ID`, `email_verified` → tìm/liên kết/tạo user → **trả JWT của mình** (sau đó mọi thứ giống đăng nhập thường). Không lưu mật khẩu Google, không cần Client Secret.
- App điện thoại lưu token bằng **expo-secure-store** (Keychain/Keystore), không dùng AsyncStorage.

Mở `src/middlewares/auth.middleware.ts` để chỉ từng bước kiểm tra.

## 6. Database

- **25 bảng** (14 bảng gốc + 11 bảng quản trị/IoT: devices, device_telemetry, device_events, error_codes, firmwares, firmware_rollouts, service_tickets, maintenance_rules, notifications, system_settings, audit_logs). 14 bảng gốc: users, user_profiles, refresh_tokens, conversations, messages, message_attachments, brands, products, comparisons, cost_estimates, diagnoses, knowledge_articles, article_favorites, guide_progress.
- **Quan hệ chính**:
  - users 1–1 user_profiles
  - users 1–n conversations 1–n messages 1–n message_attachments
  - brands 1–n products
  - products 1–n comparisons (2 khóa ngoại: first/second)
  - users n–n knowledge_articles qua article_favorites (bảng trung gian, `@@unique([userId, articleId])`)
- **Ràng buộc xóa**: xóa user → `Cascade` xóa hết dữ liệu của user; xóa brand còn sản phẩm → `Restrict` (bị chặn); xóa conversation → chẩn đoán/dự toán liên quan `SetNull`.
- **Index**: `@@index([userId, createdAt])` để lấy lịch sử của một người nhanh.
- **Tiền** dùng `Decimal(15,0)` thay vì float để không sai số.
- **Migration** (`prisma/migrations/`): mỗi lần sửa schema sinh 1 file SQL, có lịch sử. Ví dụ migration `fix_conversation_title` sửa lỗi tiêu đề mặc định bị lỗi font (`Cuá»™c...` → `Cuộc trò chuyện mới`).
- **Seed** (`prisma/seed.ts`): dữ liệu mẫu, chạy lại không bị nhân đôi (dùng `upsert`).

## 7. Nghiệp vụ đáng nói

- **Chẩn đoán** (`services/diagnosis.rules.ts`): bộ luật theo từ khóa → nguyên nhân, cách xử lý, mức rủi ro LOW/MEDIUM/HIGH/DANGER, chi phí ước tính.
  - **Lỗi cũ đã sửa**: trước đây bỏ dấu cả câu nên "chả**y** nước" → "chay nuoc" khớp "**cháy**" → báo nguy hiểm cháy nổ sai. Giờ gõ có dấu thì so khớp nguyên dấu theo ranh giới từ; gõ không dấu thì bỏ qua các từ mơ hồ ("chay", "on", "hoi").
- **Dự toán** (`services/estimate.service.ts` – hàm `calculateCost`):
  `subtotal = SL × đơn giá + vật tư + Σ(vật tư chi tiết) + công × SL + phát sinh`, `dự phòng = subtotal × %`, `tổng = subtotal + dự phòng`. Tính ở server để client không gửi số sai được; có so với ngân sách (`budgetStatus`).
- **So sánh** (`services/comparison.service.ts`): chấm điểm 6 tiêu chí (giá, điện năng, nhãn năng lượng, inverter, bảo hành, tính năng), trọng số đổi theo ưu tiên của người dùng.

## 7b. Trang quản trị (`/admin`) – 6 phân hệ

| Phân hệ | Làm gì | File chính |
|---|---|---|
| Tổng quan | KPI (online/offline/lỗi, phiếu mở, KTV rảnh), biểu đồ lỗi 14 ngày, điện năng, dịch vụ 6 tháng, cảnh báo khẩn | `dashboard.service.ts` (SQL `date_trunc` gom theo ngày/tháng) |
| Thiết bị & danh mục | Model, bảng mã lỗi + cách sửa, thiết bị theo Serial/MAC, firmware, lịch sử; OTA đẩy theo thiết bị/khu vực/toàn bộ, đếm thành công/lỗi | `device.service.ts`, `errorCode.service.ts`, `firmware.service.ts` |
| Người dùng & RBAC | Khách (thiết bị, bảo hành, lịch sử phiếu), KTV (khu vực, kỹ năng, sẵn sàng), đổi vai trò | `admin.service.ts`, `config/permissions.ts` |
| Phiếu dịch vụ | Tiếp nhận → gán KTV → đang làm → xong; vật tư + công → tổng tiền; nhắc bảo trì định kỳ | `ticket.service.ts`, `maintenance.service.ts` |
| Thông báo & CMS | Gửi thông báo theo đối tượng (tất cả/khách/nhân viên/1 người), hẹn giờ; bài viết/FAQ | `notification.service.ts`, `article.service.ts` |
| Cấu hình & nhật ký | Ngưỡng nhiệt độ/áp suất/điện, tự tạo phiếu khi lỗi nghiêm trọng, thời hạn bảo hành; audit log mọi thao tác ghi | `setting.service.ts`, `audit.service.ts` |

**IoT giả lập**: `POST /api/admin/devices/:id/simulate {scenario:'gas'}` → `device.service.ingest()` lưu số đo vào `device_telemetry`, so với ngưỡng trong `system_settings` → mã `GAS-LOW` (CRITICAL) → thiết bị chuyển ERROR, ghi `device_events`, gửi thông báo cho chủ máy, **tự tạo phiếu khẩn** `SC-YYMMDD-NNNN`. Khi có thiết bị thật (ESP32 + cảm biến) chỉ cần gọi cùng API này.

## 8. Bảo mật đã làm

| Vấn đề | Cách xử lý |
|---|---|
| Lộ mật khẩu | bcrypt, không trả `passwordHash` ra API (`omit`) |
| Giả token | JWT ký HS256, kiểm tra issuer/audience/hạn |
| Trộm refresh token | Lưu hash, xoay vòng, mỗi token dùng 1 lần, có `logout-all` |
| Dữ liệu bẩn | Zod `.strict()` – thừa trường hoặc sai kiểu → 400 |
| SQL Injection | Prisma dùng câu lệnh tham số hóa |
| Xem dữ liệu người khác | Luôn lọc theo `userId` từ token |
| Gọi API từ web lạ | `CORS_ORIGIN` |
| Lộ bí mật | `.env` nằm trong `.gitignore`, chỉ commit `.env.example` |
| Nhân viên làm quá quyền | RBAC theo quyền + KTV chỉ thấy phiếu của mình |
| Không biết ai sửa gì | Bảng `audit_logs` ghi người, hành động, đối tượng, IP, giá trị cũ→mới |

## 9. Demo trước thầy (5 phút)

1. `npm run dev` → mở `http://localhost:5000/api/health` (thấy database connected).
2. `npm run test:api` → 88 bước xanh (thêm RBAC, IoT, phiếu): đăng ký, đăng nhập, sai mật khẩu 401, không token 401, user thường thêm sản phẩm 403, CRUD đủ các bảng, lỗi "chảy/cháy".
3. `npm run db:studio` → mở bảng `cost_estimates` cho thầy thấy dữ liệu vừa lưu.
4. Mở `http://localhost:5000/admin` → đăng nhập admin → Thiết bị → chọn 1 máy → **Giả lập rò gas** → quay lại Tổng quan thấy cảnh báo + phiếu khẩn tự tạo. Đăng nhập `ktv.hung@smartcool.vn` để thấy menu ít hơn.
5. (Nếu có Postman) gọi `POST /api/auth/login` → copy `accessToken` → gọi `GET /api/diagnoses`.

## 10. Câu hỏi có thể gặp

- **Tại sao dùng PostgreSQL mà không dùng MongoDB?** Dữ liệu có quan hệ rõ (user–hội thoại–tin nhắn, hãng–sản phẩm), cần khóa ngoại và ràng buộc; Postgres vẫn có cột `Json` cho dữ liệu linh hoạt (context hội thoại, vật tư dự toán).
- **ORM là gì, tại sao Prisma?** Ánh xạ bảng ↔ object; Prisma có kiểu TypeScript tự sinh nên viết sai tên cột là báo lỗi lúc biên dịch.
- **Access token sao chỉ 15 phút?** Nếu bị lộ thì kẻ gian chỉ dùng được tối đa 15 phút; refresh token giúp người dùng không phải đăng nhập lại.
- **Token lưu ở đâu trên điện thoại?** SecureStore (mã hóa bởi hệ điều hành).
- **Nếu server chết thì app sao?** App báo "Không thể kết nối máy chủ" (timeout 15 giây trong `apiService.ts`).
- **Deploy thế nào?** Database trên Neon, API trên Render (file `render.yaml`), web trên Vercel. Chi tiết: `docs/DATABASE_SERVER.md`.
