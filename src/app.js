const express = require("express");
const path = require("path");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const User = require("./models/User");
const app = express();

// Set View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve Static Files
app.use(express.static(path.join(__dirname, "views/public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(
  session({
    secret: "wildcamp-secret-key-123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  }),
);

// Share session user to EJS templates globally
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Admin protection middleware
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  res.redirect("/auth/login");
};

// Simulated DB for demo products
const products = [
  {
    id: 1,
    name: "Lều Cắm Trại 4 Người Premium",
    price: "1,850,000đ",
    category: "Lều Trại",
    image: "/assets/img/img-1.svg",
    rating: 4.8,
    desc: "Lều chống mưa gió tiêu chuẩn quốc tế",
  },
  {
    id: 2,
    name: "Túi Ngủ Đi Phượt Siêu Ấm",
    price: "450,000đ",
    category: "Túi Ngủ",
    image: "/assets/img/img-2.svg",
    rating: 4.6,
    desc: "Giữ ấm ở nhiệt độ xuống tới 5 độ C",
  },
  {
    id: 3,
    name: "Bếp Ga Dã Ngoại Gấp Gọn",
    price: "320,000đ",
    category: "Bếp Trại",
    image: "/assets/img/img-4.svg",
    rating: 4.7,
    desc: "Tiện lợi, an toàn và tiết kiệm ga",
  },
  {
    id: 4,
    name: "Đèn Bão Vintage Rechargeable",
    price: "280,000đ",
    category: "Phụ Kiện",
    image: "/assets/img/img-3.svg",
    rating: 4.9,
    desc: "Pin sạc Type-C, sáng liên tục 24h",
  },
];

const categories = [
  "Lều Trại",
  "Túi Ngủ",
  "Bếp Trại",
  "Phụ Kiện",
  "Dụng Cụ Sinh Tồn",
];

const orders = [
  {
    id: "ORD001",
    customer: "Nguyen Van A",
    date: "05/06/2026",
    total: "2,300,000đ",
    status: "Đang xử lý",
  },
  {
    id: "ORD002",
    customer: "Tran Thi B",
    date: "04/06/2026",
    total: "450,000đ",
    status: "Đã hoàn thành",
  },
  {
    id: "ORD003",
    customer: "Le Van C",
    date: "03/06/2026",
    total: "320,000đ",
    status: "Đã hủy",
  },
];

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.render("homepage/index", { products });
});

app.get("/cart", (req, res) => {
  res.render("cart/index", { cartItems: products.slice(0, 2) });
});

app.get("/checkout", (req, res) => {
  res.render("checkout/index");
});

// Admin Routes
app.get("/admin", isAdmin, (req, res) => {
  res.render("admin/dashboard", { products });
});

app.get("/admin/products", isAdmin, (req, res) => {
  res.render("admin/products", { products });
});

app.get("/admin/orders", isAdmin, (req, res) => {
  res.render("admin/orders", { orders });
});

// Admin router mount
app.use("/admin", isAdmin, adminRoutes);

app.get("/admin/reports", isAdmin, (req, res) => {
  res.render("admin/reports");
});

app.get("/admin/categories", isAdmin, (req, res) => {
  res.render("admin/categories", { categories });
});

module.exports = app;
