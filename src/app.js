const express = require("express");
const path = require("path");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Product  = require("./models/Product");
const Category = require("./models/Category");
const Order    = require("./models/Order");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "views/public")));

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "views/public/assets/img/favicon.png"));
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => res.json({}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "wildcamp-secret-key-123",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// Share user + footer categories to all templates
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  try {
    res.locals.footerCategories = await Category.find({}).sort({ name: 1 }).limit(6);
  } catch {
    res.locals.footerCategories = [];
  }
  next();
});

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.redirect("/auth/login");
};

const requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/login");
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function buildCart(sessionCart) {
  if (!sessionCart || sessionCart.length === 0) return { cartItems: [], total: 0 };
  const ids = sessionCart.map(i => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const cartItems = sessionCart.map(ci => {
    const p = products.find(x => x._id.toString() === ci.productId);
    if (!p) return null;
    return { ...p.toObject(), quantity: ci.quantity, subtotal: p.price * ci.quantity };
  }).filter(Boolean);
  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  return { cartItems, total };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);

// ─── Homepage ─────────────────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
    res.render("homepage/index", { products });
  } catch {
    res.render("homepage/index", { products: [] });
  }
});

// ─── Cart ─────────────────────────────────────────────────────────────────────
app.get("/cart", async (req, res) => {
  try {
    const { cartItems, total } = await buildCart(req.session.cart);
    res.render("cart/index", { cartItems, total });
  } catch {
    res.render("cart/index", { cartItems: [], total: 0 });
  }
});

app.post("/cart/add", requireLogin, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find(i => i.productId === productId);
  if (existing) existing.quantity += parseInt(quantity);
  else req.session.cart.push({ productId, quantity: parseInt(quantity) });
  res.redirect("/cart");
});

app.post("/cart/remove", requireLogin, (req, res) => {
  const { productId } = req.body;
  if (req.session.cart)
    req.session.cart = req.session.cart.filter(i => i.productId !== productId);
  res.redirect("/cart");
});

app.post("/cart/update", requireLogin, (req, res) => {
  const { productId, quantity } = req.body;
  if (req.session.cart) {
    const item = req.session.cart.find(i => i.productId === productId);
    if (item) item.quantity = Math.max(1, parseInt(quantity) || 1);
  }
  res.redirect("/cart");
});

// ─── Checkout ─────────────────────────────────────────────────────────────────
app.get("/checkout", requireLogin, async (req, res) => {
  try {
    const { cartItems, total } = await buildCart(req.session.cart);
    res.render("checkout/index", { cartItems, total });
  } catch {
    res.render("checkout/index", { cartItems: [], total: 0 });
  }
});

app.post("/checkout", requireLogin, async (req, res) => {
  try {
    const { name, phone, address, note, paymentMethod } = req.body;
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect("/cart");

    const ids = cart.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } });
    const items = cart.map(ci => {
      const p = products.find(x => x._id.toString() === ci.productId);
      if (!p) return null;
      return { productId: p._id, name: p.name, price: p.price, image: p.image, quantity: ci.quantity };
    }).filter(Boolean);

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    await new Order({ customer: { name, phone, address }, note, items, total, paymentMethod: paymentMethod || "COD" }).save();
    req.session.cart = [];
    res.redirect("/order-success");
  } catch (err) {
    res.redirect("/checkout");
  }
});

app.get("/order-success", (req, res) => res.render("order-success"));

// ─── Admin ────────────────────────────────────────────────────────────────────
app.get("/admin", isAdmin, async (req, res) => {
  try {
    const [productCount, categoryCount, orderCount, revenueResult, recentOrders] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: "Đã hủy" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.find({}).sort({ createdAt: -1 }).limit(5)
    ]);
    const totalRevenue = revenueResult.length ? revenueResult[0].total : 0;
    res.render("admin/dashboard", { productCount, categoryCount, orderCount, totalRevenue, recentOrders });
  } catch {
    res.render("admin/dashboard", { productCount: 0, categoryCount: 0, orderCount: 0, totalRevenue: 0, recentOrders: [] });
  }
});

app.get("/admin/orders", isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.render("admin/orders", { orders });
  } catch {
    res.render("admin/orders", { orders: [] });
  }
});

app.post("/admin/orders/status/:id", isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
  } catch {}
  res.redirect("/admin/orders");
});

app.get("/admin/reports", isAdmin, async (req, res) => {
  try {
    const today = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const result = await Order.aggregate([
        { $match: { status: { $ne: "Đã hủy" }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);
      weeklyData.push({ day: dayNames[d.getDay()], revenue: result.length ? result[0].total : 0 });
    }
    res.render("admin/reports", { weeklyData });
  } catch {
    res.render("admin/reports", { weeklyData: [] });
  }
});

// Admin router mount (users, categories, products)
app.use("/admin", isAdmin, adminRoutes);

module.exports = app;
