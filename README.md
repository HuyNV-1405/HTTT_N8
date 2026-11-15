# HỆ THỐNG QUẢN LÝ KHO HÀNG (WAREHOUSE MANAGEMENT SYSTEM - WMS)

> **Nhóm thực hiện**: Nhóm 8 - Đề tài: Hệ thống Quản lý Kho Hàng  
> **Kiến trúc**: Full-Stack Node.js (TypeScript, Express) + PostgreSQL 16 + Prisma ORM + React (TypeScript, Tailwind CSS)  
> **Môi trường**: Docker & Docker Compose (Hỗ trợ chuẩn hóa làm việc nhóm, chống mất mát dữ liệu với persistent volume)

---

## 📁 1. CẤU TRÚC THƯ MỤC DỰ ÁN

```bash
HTTT/
├── docker-compose.yml          # Cấu hình container PostgreSQL 16 & pgAdmin 4
├── .env.example                # Mẫu biến môi trường cho cả nhóm
├── .gitignore                  # Bỏ qua node_modules, pgdata, .env
├── README.md                   # Tài liệu hướng dẫn chi tiết thiết lập & chạy dự án
│
├── backend/                    # Mã nguồn Backend RESTful API
│   ├── .env                    # Cấu hình môi trường riêng của Backend
│   ├── package.json            # Scripts: dev, build, db:migrate, db:push, db:seed, db:studio
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # Thiết kế Database chuẩn hóa theo ERD/DFD (14 bảng, 6 enums)
│   │   └── seed.ts             # Script nạp dữ liệu mẫu ban đầu (Auto-seeding)
│   └── src/
│       ├── config/prisma.ts    # Singleton Prisma Client
│       ├── controllers/        # Điều hướng API (Auth, Product, Receipt, Dispatch, Transfer, Inventory, Location)
│       ├── services/           # Nghiệp vụ Transaction (Cộng/Trừ tồn kho an toàn)
│       ├── routes/             # Định tuyến RESTful API
│       ├── middlewares/        # JWT Authentication & RBAC (Role-based access control)
│       ├── utils/              # Helper responses & auto code generators
│       └── server.ts           # Server khởi chạy tại cổng 5000
│
└── frontend/                   # Giao diện người dùng (React 18, TypeScript, Tailwind CSS)
    ├── package.json            # Scripts: dev (cổng 5173), build
    ├── vite.config.ts          # Reverse proxy kết nối API backend tự động
    ├── tailwind.config.js
    └── src/
        ├── components/         # Dashboard, Hàng hóa, Nhập kho, Xuất kho, Điều chuyển, Sơ đồ vị trí, Cảnh báo
        ├── types/              # Type definitions đồng bộ với Backend
        └── App.tsx             # Giao diện chính và luồng xử lý
```

---

## 🚀 2. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (DÀNH CHO THÀNH VIÊN TRONG NHÓM)

### BƯỚC 1: Khởi động PostgreSQL qua Docker Compose
1. Đảm bảo **Docker Desktop** trên máy tính đã được bật.
2. Tại thư mục gốc `D:\HTTT`, mở terminal chạy lệnh:
   ```bash
   docker compose up -d
   ```
> **Đảm bảo toàn vẹn dữ liệu**: Dữ liệu database được mount trực tiếp vào thư mục `./pgdata` trên ổ đĩa máy tính của bạn, không bao giờ bị mất khi khởi động lại máy hoặc xóa container.

*(Tùy chọn) Truy cập giao diện quản trị DB pgAdmin tại: `http://localhost:5050` (Email: `admin@wms.com` | Password: `admin`)*

---

### BƯỚC 2: Thiết lập Database và nạp dữ liệu mẫu (Seeding)
Mở terminal, di chuyển vào thư mục `backend`:
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
```

Script Seeding sẽ tự động nạp sẵn:
- **5 tài khoản kiểm thử** (Mật khẩu băm Bcrypt an toàn):
  1. Quản trị viên (Admin): `admin` / `Admin@123`
  2. Quản lý kho (Manager): `quanlykho` / `Quanly@123`
  3. Nhân viên kho (Staff): `nhanvienkho` / `Nhanvien@123`
  4. Nhân viên mua hàng: `muahang` / `Muahang@123`
  5. Nhân viên kinh doanh: `banhang` / `Banhang@123`
- **Kho bãi & Sơ đồ phân cấp 5 tầng**: Kho Tổng Hà Nội, Kho TP.HCM với đầy đủ Khu vực, Kệ, Tầng, Ô lưu trữ.
- **Hàng hóa, Danh mục, Nhà cung cấp, Khách hàng & Tồn kho thực tế**.
- **Cảnh báo tồn kho mẫu** (Sản phẩm dưới định mức tối thiểu).
- **Phiếu nhập mẫu & Phiếu xuất mẫu** ở trạng thái `PENDING` để bạn có thể test ngay nút **Phê Duyệt** trên giao diện!

---

### BƯỚC 3: Khởi chạy Backend API Server
Vẫn trong thư mục `backend`, chạy:
```bash
npm run dev
```
Backend API sẽ hoạt động tại: **`http://localhost:5000`** (Healthcheck: `http://localhost:5000/api/health`).

---

### BƯỚC 4: Khởi chạy Frontend Dashboard
Mở một cửa sổ terminal mới, di chuyển vào thư mục `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Trình duyệt sẽ tự động mở giao diện tại: **`http://localhost:5173`**.

---

## ⚙️ 3. LUỒNG NGHIỆP VỤ & RÀNG BUỘC TRANSACTION ĐÃ THỰC THI

1. **Phân hệ Hàng hóa & Định mức**:
   - Quản lý định mức tối thiểu (`dinhMucToiThieu`) và tối đa (`dinhMucToiDa`).
2. **Quy trình Nhập kho**:
   - Lập phiếu nhập ở trạng thái `PENDING` kèm thông tin chỉ định cất vào Ô lưu trữ (`viTriId`).
   - Quản lý kho nhấn **"Phê duyệt"** &rarr; Hệ thống kích hoạt **Database Transaction** (`prisma.$transaction`) để:
     - Tăng số lượng thực tế và khả dụng trong `TonKho`.
     - Cập nhật trạng thái ô lưu trữ sang `PARTIAL` hoặc `FULL`.
     - Tự động kiểm tra và giải tỏa cảnh báo thiếu hàng nếu số lượng đã đạt chuẩn.
     - Ghi nhật ký kiểm toán `LichSuThaoTac`.
3. **Quy trình Xuất kho**:
   - Kiểm tra điều kiện tồn kho thực tế trước khi lập phiếu.
   - Khi lập phiếu, tạm giữ tồn khả dụng (`soLuongTamGiu += SL`, `soLuongKhaDung -= SL`).
   - Quản lý kho nhấn **"Phê duyệt"** &rarr; Hệ thống kích hoạt **Database Transaction**:
     - Kiểm tra tồn thực tế lần cuối & trừ tồn kho (`soLuongTon -= SL`).
     - Tự động quét điều kiện: nếu số lượng tồn kho giảm xuống dưới `dinhMucToiThieu` hoặc `= 0`, hệ thống **tự động sinh Cảnh Báo Tồn Kho** ngay lập tức!
     - Nếu bị Từ chối, tự động hoàn trả số lượng tạm giữ vào tồn khả dụng.
4. **Quy trình Chuyển kho**:
   - Trừ tồn kho nguồn và cộng tồn kho đích bằng Transaction liên kho.
5. **Sơ đồ Vị trí Trực quan (Storage Grid Visualizer)**:
   - Hiển thị trực quan toàn bộ các ô kệ trong kho theo tỷ lệ lấp đầy %, mã vị trí và danh sách sản phẩm nằm bên trong khi click chọn ô.
