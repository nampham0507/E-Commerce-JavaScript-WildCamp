# WildCamp - E-commerce

Nền tảng bán hàng trực tuyến được xây dựng bằng Node.js + Express + MongoDB, hỗ trợ quản lý sản phẩm, giỏ hàng, thanh toán VNPay và bảng điều khiển admin toàn diện.

---

## Mục lục

- [Tính năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Tài khoản mặc định](#tài-khoản-mặc-định)

---

## Tính năng

### Người dùng
- Đăng ký, đăng nhập với mã hoá mật khẩu (bcrypt)
- Duyệt sản phẩm theo danh mục, tìm kiếm, lọc theo giá
- Giỏ hàng (thêm, xóa, cập nhật số lượng)
- Đặt hàng với hai hình thức thanh toán: **COD** và **VNPay**
- Xem lịch sử đơn hàng, hủy đơn hàng (khi đang chờ xác nhận)
- Đánh giá sản phẩm theo sao và bình luận

### Admin
- Quản lý người dùng, sản phẩm, danh mục (CRUD)
- Cập nhật trạng thái đơn hàng
- Báo cáo doanh thu theo khoảng thời gian
- Biểu đồ doanh thu theo tuần
- Top 10 sản phẩm bán chạy
- Cảnh báo sản phẩm sắp hết hàng
- Xuất báo cáo ra file Excel

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Template Engine | EJS |
| Authentication | express-session + bcryptjs |
| File Upload | Multer |
| Payment | VNPay |
| Export | ExcelJS |
| Dev | Nodemon |

---

## Yêu cầu

- Node.js >= 18
- MongoDB (local hoặc MongoDB Atlas)
- Tài khoản VNPay sandbox (nếu test thanh toán)

---

## Cài đặt

```bash
git clone https://github.com/your-username/webbanleu.git
cd webbanleu
npm install
```

---

## Cấu hình môi trường

Tạo file `.env` ở thư mục gốc:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/banleu

SESSION_SECRET=your_session_secret

VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/vnpay/return
```

---

## Chạy ứng dụng

```bash
# Khởi động (development — tự reload khi thay đổi file)
npm run dev

# Khởi động (production)
npm start

# Seed dữ liệu mẫu vào database
npm run seed
```

Mở trình duyệt tại `http://localhost:3000`

---

## Cấu trúc thư mục

```
webbanleu/
├── server.js               # Entry point
├── src/
│   ├── app.js              # Cấu hình Express
│   ├── config/
│   │   ├── db.js           # Kết nối MongoDB
│   │   ├── multer.js       # Cấu hình upload ảnh
│   │   └── seed.js         # Dữ liệu mẫu
│   ├── controllers/        # Business logic
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── CartItem.js
│   │   └── Review.js
│   ├── routes/             # Express routers
│   ├── services/
│   │   ├── vnpay.js        # Tích hợp VNPay
│   │   └── excelReport.js  # Xuất báo cáo Excel
│   └── views/              # EJS templates
│       ├── admin/
│       ├── auth/
│       ├── cart/
│       ├── checkout/
│       ├── product/
│       ├── orders/
│       └── partials/
└── public/                 # Static assets (CSS, JS, ảnh)
```

---

## Tài khoản mặc định

Sau khi chạy `npm run seed`:

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | admin@example.com | admin123 |
| User | user@example.com | user123 |

> Kiểm tra file `src/config/seed.js` để xem hoặc thay đổi tài khoản mặc định.