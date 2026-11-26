# Database và Server – hướng dẫn cài đặt

Có 2 cách chạy. Khi demo trên lớp nên chuẩn bị **cả hai**: chạy local làm chính, bản online làm dự phòng.

| | Database | Server (API) | Dùng khi |
|---|---|---|---|
| **Local** | PostgreSQL trên máy bạn | `npm run dev` trên máy bạn | Code, demo cùng mạng Wi-Fi |
| **Online** | Neon (PostgreSQL cloud, miễn phí) | Render (miễn phí) | Điện thoại dùng 4G, gửi link cho thầy |

---

## 1. Database trên máy (chọn A hoặc B)

### A. Cài PostgreSQL cho Windows (không cần Docker)

1. Tải tại https://www.postgresql.org/download/windows/ (bản 16 hoặc 17), cài mặc định, **ghi nhớ mật khẩu user `postgres`**, cổng 5432.
2. Mở **pgAdmin** (hoặc SQL Shell `psql`) và chạy:
   ```sql
   CREATE USER smartcool WITH PASSWORD 'smartcool' CREATEDB;
   CREATE DATABASE smartcool_ai OWNER smartcool;
   ```
   (`CREATEDB` cần cho lệnh `npm run db:migrate`, vì Prisma tạo DB tạm để so sánh.)
3. Trong `backend/.env`:
   ```
   DATABASE_URL="postgresql://smartcool:smartcool@localhost:5432/smartcool_ai?schema=public"
   ```

### B. Dùng Docker

```bash
docker compose up -d     # ở thư mục gốc repo, dùng file docker-compose.yml
```
`DATABASE_URL` giống hệt mục A.

### Tạo bảng + dữ liệu mẫu

```bash
cd backend
npm install
npm run db:deploy        # tạo 14 bảng từ prisma/migrations
npm run db:seed          # 2 tài khoản, 10 thương hiệu, 16 sản phẩm, 8 bài viết, lịch sử mẫu
npm run db:studio        # (tuỳ chọn) xem dữ liệu trên trình duyệt
```

Hoặc bấm đúp `backend/CHAY-BACKEND.cmd` để làm hết các bước và mở server.

---

## 2. Chạy server trên máy

```bash
cd backend
npm run dev              # http://localhost:5000/api/health
npm run test:api         # mở cửa sổ khác: kiểm tra 88 bước API (đăng ký, JWT, CRUD...)
```

### Cho điện thoại gọi vào server trên máy

1. Điện thoại và laptop **cùng một mạng Wi-Fi**.
2. Xem IP laptop: mở CMD gõ `ipconfig` → dòng **IPv4 Address**, ví dụ `192.168.1.15`.
3. Cho phép cổng 5000 qua tường lửa (CMD chạy quyền Administrator):
   ```
   netsh advfirewall firewall add rule name="SmartCool API" dir=in action=allow protocol=TCP localport=5000
   ```
4. Trên điện thoại mở trình duyệt vào `http://192.168.1.15:5000/api/health` để thử.
5. App Expo dùng `EXPO_PUBLIC_API_URL=http://192.168.1.15:5000/api` (file `mobile/.env`).

Server đã lắng nghe `0.0.0.0` nên máy khác trong mạng gọi được.

---

## 3. Database online với Neon

1. Vào https://neon.tech → đăng nhập bằng GitHub → **Create project** (region Singapore cho nhanh).
2. Bấm **Connect**, copy **connection string** dạng
   `postgresql://neondb_owner:xxxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Tạo bảng và seed lên Neon từ máy bạn (tạm thay `DATABASE_URL` trong `backend/.env` bằng chuỗi Neon):
   ```bash
   npm run db:deploy
   npm run db:seed
   ```
   Xong thì đổi `.env` về local nếu muốn.

## 4. Server online với Render

1. Vào https://render.com → đăng nhập bằng GitHub (tài khoản có repo SmartCoolAI).
2. **New → Blueprint** → chọn repo → Render đọc file `render.yaml` ở gốc repo.
3. Ở bước hỏi biến môi trường, dán **DATABASE_URL** của Neon. `JWT_ACCESS_SECRET` Render tự sinh.
4. Đợi build xong (lệnh build đã gồm `prisma migrate deploy`), mở
   `https://smartcool-ai-api.onrender.com/api/health`.

Nếu muốn tạo tay (không dùng Blueprint): **New → Web Service**, Root Directory `backend`,
Build `npm ci --include=dev && npm run build && npx prisma migrate deploy`, Start `npm start`, rồi thêm các biến như trong `.env.example`.

> Gói Free của Render **ngủ sau 15 phút** không ai gọi; lần gọi đầu mất khoảng 30–50 giây để thức dậy.
> Trước giờ bảo vệ 5 phút hãy mở `/api/health` một lần.

Sau khi có URL Render:
- App điện thoại: `EXPO_PUBLIC_API_URL=https://smartcool-ai-api.onrender.com/api`
- Web Vercel: thêm biến `VITE_API_URL` tương tự, và giữ `CORS_ORIGIN=https://smartcoolai.vercel.app` trên Render.

---

## 5. Đăng nhập Google (tùy chọn)

Server chỉ cần **Client ID** (không cần Client Secret, vì server tự kiểm tra chữ ký `id_token` của Google).

1. Vào https://console.cloud.google.com → góc trên chọn **New Project** → đặt tên `SmartCool` → Create.
2. Menu **APIs & Services → OAuth consent screen** (hoặc **Google Auth Platform → Branding**):
   User type **External**, App name `SmartCool`, email hỗ trợ = email của bạn → Save.
   Ở mục **Audience / Test users** bấm **Add users** và thêm các Gmail sẽ dùng để demo.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins** thêm 2 dòng:
     - `http://localhost:5000`
     - `https://smartcool-ai-api.onrender.com`
     - `https://smartcoolai.vercel.app` (trang web chính)
   - (không cần Redirect URI) → Create.
4. Copy chuỗi **Client ID** (dạng `1234…-abc.apps.googleusercontent.com`) rồi dán vào:
   - Máy: `backend/.env` → `GOOGLE_CLIENT_ID=...` rồi chạy lại server.
   - Render: Service → **Environment** → Add `GOOGLE_CLIENT_ID` → Save (Render tự deploy lại).
5. Mở trang web (`https://smartcoolai.vercel.app`) hoặc `/admin` → nút Google chuyển thành nút chính thức của Google.
   Khi chưa có Client ID, bấm nút Google sẽ báo "Máy chủ chưa bật đăng nhập Google".

Cách hoạt động: trình duyệt lấy `id_token` từ Google → gửi `POST /api/auth/google { idToken }` →
server kiểm tra chữ ký + `aud` = Client ID + email đã xác minh → tìm user theo `googleId`, nếu chưa có thì
theo email (liên kết tài khoản cũ), chưa có nữa thì tạo user mới (vai trò Khách hàng) → trả **JWT access + refresh
giống hệt đăng nhập thường**. Tài khoản Google mới là Khách hàng; muốn vào trang quản trị thì Super Admin đổi vai trò.

---

## 6. Trang quản trị `/admin`

Server phục vụ luôn giao diện quản trị: `http://localhost:5000/admin` (hoặc `https://smartcool-ai-api.onrender.com/admin`).

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| admin@smartcool.vn | Admin@123456 | Super Admin (toàn quyền) |
| kho@smartcool.vn | Staff@123456 | Quản lý kho / kỹ thuật |
| cskh@smartcool.vn | Staff@123456 | Chăm sóc khách hàng |
| ktv.hung@smartcool.vn (ktv.minh, ktv.tuan, ktv.long) | Staff@123456 | Kỹ thuật viên |
| demo@smartcool.vn | Demo@123456 | Khách hàng (bị chặn vào /admin) |

Dữ liệu IoT là **giả lập**: seed tạo 32 thiết bị + 14 ngày số đo. Trong chi tiết thiết bị có nút
**Giả lập rò gas / quá nhiệt / lỗi cảm biến** → server áp ngưỡng ở trang Cấu hình → đổi trạng thái ERROR,
báo cho chủ máy và tự tạo phiếu khẩn cấp.

---

## 7. Lỗi hay gặp

| Lỗi | Cách sửa |
|---|---|
| `Không tìm thấy DATABASE_URL` | Chưa có `backend/.env` → copy từ `.env.example` |
| `JWT_ACCESS_SECRET phải có ít nhất 64 ký tự` | Tạo chuỗi bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `P1001 Can't reach database server` | PostgreSQL chưa chạy (Services → postgresql-x64-16 → Start) hoặc sai cổng |
| `password authentication failed` | Sai user/mật khẩu trong `DATABASE_URL` |
| `Cannot find module '../generated/prisma/client'` | Chạy `npx prisma generate` |
| Điện thoại báo không kết nối được | Sai IP, khác Wi-Fi, hoặc tường lửa chặn cổng 5000 |
| Nút Google báo `origin_mismatch` / không hiện | Thiếu origin đúng ở bước 3 mục 5, hoặc chưa đặt `GOOGLE_CLIENT_ID` |
| Google báo `access_denied` | Gmail chưa có trong **Test users** |
