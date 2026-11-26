# SmartCool AI

Trợ lý điện lạnh thông minh – đồ án môn **Lập Trình Di Động**.

| Thư mục | Nội dung |
|---|---|
| `index.html` | Giao diện mới (bản thiết kế web, mở trực tiếp bằng trình duyệt) |
| `backend/` | **API**: Express + Prisma + PostgreSQL + JWT – [backend/README.md](backend/README.md) |
| `client/` | Web React + Vite |
| `mobile/` | App điện thoại Expo / React Native |
| `docs/DATABASE_SERVER.md` | Cài database (local / Neon) và host server (Render) |
| `DEFENSE_GUIDE.md` | Ôn bảo vệ: phân lớp, luồng request, CRUD, JWT, database |

## Chạy nhanh backend

```bash
docker compose up -d          # hoặc dùng PostgreSQL cài sẵn trên Windows
cd backend
copy .env.example .env        # macOS/Linux: cp
npm install
npm run db:deploy && npm run db:seed
npm run dev                   # http://localhost:5000/api/health
```

Windows: bấm đúp `backend/CHAY-BACKEND.cmd`.

Tài khoản mẫu: `admin@smartcool.vn / Admin@123456` · `demo@smartcool.vn / Demo@123456`
