const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Product  = require("./models/Product");
const Category = require("./models/Category");
const Order    = require("./models/Order");
const Cart     = require("./models/Cart");
const CartItem = require("./models/CartItem");
const vnpay    = require("./services/vnpay");
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

app.use(flash());

// Always initialize flash locals so templates never throw ReferenceError
app.use((req, res, next) => {
  try {
    res.locals.flash = {
      success: req.flash("success")[0] || null,
      error:   req.flash("error")[0]   || null,
    };
  } catch {
    res.locals.flash = { success: null, error: null };
  }
  next();
});

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
  // GET requests: redirect back after login
  if (req.method === "GET") {
    req.session.returnTo = req.originalUrl;
  } else if (req.body && req.body.productId &&
             (req.originalUrl === "/cart/add" || req.originalUrl === "/cart/buy-now")) {
    // Save pending cart action to replay after login
    req.session.pendingCart = {
      productId: req.body.productId,
      quantity:  req.body.quantity  || 1,
      buyNow:    req.originalUrl === "/cart/buy-now",
    };
    req.session.returnTo = "/cart/apply-pending";
  } else {
    req.session.returnTo = "/";
  }
  res.redirect("/auth/login");
};

// Phí vận chuyển cố định áp dụng khi thanh toán
const SHIPPING_FEE = 30000;

// ─── Cart Helpers ─────────────────────────────────────────────────────────────
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId });
  return cart;
}

async function buildCartFromDB(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return { cartItems: [], total: 0 };
  const items = await CartItem.find({ cart: cart._id }).populate('product');
  const cartItems = items
    .filter(item => item.product)
    .map(item => ({
      _id:      item.product._id,
      name:     item.product.name,
      price:    item.product.price,
      image:    item.product.image,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));
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
    if (!req.session.user)
      return res.render("cart/index", { cartItems: [], subtotal: 0, shippingFee: 0, total: 0 });
    const { cartItems, total: subtotal } = await buildCartFromDB(req.session.user.id);
    const shippingFee = cartItems.length ? SHIPPING_FEE : 0;
    res.render("cart/index", { cartItems, subtotal, shippingFee, total: subtotal + shippingFee });
  } catch {
    res.render("cart/index", { cartItems: [], subtotal: 0, shippingFee: 0, total: 0 });
  }
});

// Shared helper: upsert one item into a cart
async function upsertCartItem(cartId, productId, qty) {
  const existing = await CartItem.findOne({ cart: cartId, product: productId });
  if (existing) {
    existing.quantity += qty;
    await existing.save();
  } else {
    await CartItem.create({ cart: cartId, product: productId, quantity: qty });
  }
}

// Replay pending cart action saved before login redirect
app.get("/cart/apply-pending", requireLogin, async (req, res) => {
  try {
    const pending = req.session.pendingCart;
    if (pending) {
      delete req.session.pendingCart;
      const qty = Math.max(1, parseInt(pending.quantity) || 1);
      const cart = await getOrCreateCart(req.session.user.id);
      await upsertCartItem(cart._id, pending.productId, qty);
      return res.redirect(pending.buyNow ? "/checkout" : "/cart");
    }
    res.redirect("/cart");
  } catch (err) {
    console.error("[cart/apply-pending]", err.message);
    res.redirect("/cart");
  }
});

app.post("/cart/add", requireLogin, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const cart = await getOrCreateCart(req.session.user.id);
    await upsertCartItem(cart._id, productId, qty);
    res.redirect("/cart");
  } catch (err) {
    console.error("[cart/add]", err.message);
    req.flash("error", "Không thể thêm vào giỏ hàng: " + err.message);
    res.redirect("/cart");
  }
});

app.post("/cart/buy-now", requireLogin, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const cart = await getOrCreateCart(req.session.user.id);
    await upsertCartItem(cart._id, productId, qty);
    res.redirect("/checkout");
  } catch (err) {
    console.error("[cart/buy-now]", err.message);
    res.redirect("/");
  }
});

app.post("/cart/remove", requireLogin, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.session.user.id });
    if (cart) await CartItem.deleteOne({ cart: cart._id, product: productId });
    res.redirect("/cart");
  } catch (err) {
    console.error("[cart/remove]", err.message);
    res.redirect("/cart");
  }
});

app.post("/cart/update", requireLogin, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 0;
    const cart = await Cart.findOne({ user: req.session.user.id });
    if (cart) {
      if (qty <= 0) {
        await CartItem.deleteOne({ cart: cart._id, product: productId });
      } else {
        await CartItem.findOneAndUpdate(
          { cart: cart._id, product: productId },
          { quantity: qty }
        );
      }
    }
    res.redirect("/cart");
  } catch (err) {
    console.error("[cart/update]", err.message);
    res.redirect("/cart");
  }
});

// ─── Checkout ─────────────────────────────────────────────────────────────────
app.get("/checkout", requireLogin, async (req, res) => {
  try {
    const { cartItems, total: subtotal } = await buildCartFromDB(req.session.user.id);
    const shippingFee = cartItems.length ? SHIPPING_FEE : 0;
    res.render("checkout/index", { cartItems, subtotal, shippingFee, total: subtotal + shippingFee });
  } catch {
    res.render("checkout/index", { cartItems: [], subtotal: 0, shippingFee: 0, total: 0 });
  }
});

app.post("/checkout", requireLogin, async (req, res) => {
  try {
    const { name, phone, province, district, ward, streetAddress, note, paymentMethod } = req.body;
    const address = [streetAddress, ward, district, province].filter(Boolean).join(', ');
    const cart = await Cart.findOne({ user: req.session.user.id });
    if (!cart) return res.redirect("/cart");

    const cartItems = await CartItem.find({ cart: cart._id }).populate('product');
    const items = cartItems
      .filter(ci => ci.product)
      .map(ci => ({
        productId: ci.product._id,
        name:      ci.product.name,
        price:     ci.product.price,
        image:     ci.product.image,
        quantity:  ci.quantity,
      }));

    if (items.length === 0) return res.redirect("/cart");

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + SHIPPING_FEE;

    if (paymentMethod === "VNPay") {
      // KHÔNG tạo đơn hàng / KHÔNG xóa giỏ ở bước này.
      // Chỉ lưu snapshot đơn hàng vào session, đơn hàng thật chỉ được tạo
      // khi VNPay xác nhận thanh toán thành công (ở /vnpay/return).
      const orderCode = "ORD" + Date.now();
      req.session.pendingOrder = {
        orderCode,
        customer: { name, phone, address },
        note,
        items: items.map(i => ({ ...i, productId: i.productId.toString() })),
        shippingFee: SHIPPING_FEE,
        total,
      };

      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const payUrl = vnpay.createPaymentUrl(
        orderCode,
        total,
        `Thanh toan don hang ${orderCode}`,
        ipAddr
      );
      return res.redirect(payUrl);
    }

    // COD → chờ admin xác nhận
    await new Order({
      customer: { name, phone, address },
      note, items, total,
      paymentMethod:  "COD",
      paymentStatus:  "N/A",
      status:         "Chờ xác nhận",
    }).save();
    await CartItem.deleteMany({ cart: cart._id });
    res.redirect("/order-success");
  } catch (err) {
    console.error("[checkout]", err.message);
    req.flash("error", "Có lỗi xảy ra khi đặt hàng, vui lòng thử lại.");
    res.redirect("/checkout");
  }
});

// ─── VNPay Callbacks ───────────────────────────────────────────────────────────
app.get("/vnpay/return", requireLogin, async (req, res) => {
  const { valid, responseCode, txnRef, amount } = vnpay.verifyReturn(req.query);
  const pending = req.session.pendingOrder;

  // Dù kết quả thế nào cũng xóa snapshot để không tạo lại nhầm
  delete req.session.pendingOrder;

  // Thanh toán thất bại / người dùng hủy → KHÔNG tạo đơn hàng, GIỮ nguyên giỏ hàng
  if (!valid || responseCode !== "00") {
    return res.redirect("/order-failed?reason=" + (valid ? responseCode : "invalid_signature"));
  }

  // Không còn snapshot (vd session hết hạn) hoặc dữ liệu không khớp → không tạo đơn
  if (!pending || pending.orderCode !== txnRef || pending.total !== amount) {
    return res.redirect("/order-failed?reason=mismatch");
  }

  try {
    // Thanh toán thành công → tạo đơn, đã thanh toán nên xác nhận luôn
    await new Order({
      orderCode:     pending.orderCode,
      customer:      pending.customer,
      note:          pending.note,
      items:         pending.items,
      total:         pending.total,
      paymentMethod: "VNPay",
      paymentStatus: "paid",
      status:        "Đã xác nhận",
    }).save();

    const cart = await Cart.findOne({ user: req.session.user.id });
    if (cart) await CartItem.deleteMany({ cart: cart._id });

    res.redirect("/order-success");
  } catch (err) {
    console.error("[vnpay/return]", err.message);
    res.redirect("/order-failed?reason=server_error");
  }
});

app.get("/order-success", (req, res) => res.render("order-success"));
app.get("/order-failed",  (req, res) => res.render("order-failed"));

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
    const PAGE_SIZE = 10;
    const currentPage = Math.max(1, parseInt(req.query.page) || 1);
    const [orders, totalItems] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip((currentPage - 1) * PAGE_SIZE).limit(PAGE_SIZE),
      Order.countDocuments()
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    res.render("admin/orders", { orders, currentPage, totalPages, totalItems });
  } catch {
    res.render("admin/orders", { orders: [], currentPage: 1, totalPages: 1, totalItems: 0 });
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
