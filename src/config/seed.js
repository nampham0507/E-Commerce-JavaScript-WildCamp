require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Unsplash direct photo URLs ────────────────────────────────────────────────
// Format: https://images.unsplash.com/photo-<ID>?w=600&h=600&fit=crop&q=80
// Mỗi photo ID được kiểm chứng thực tế trên Unsplash
const IMG = {
  tent_dome:
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=600&fit=crop&q=80",
  tent_family:
    "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&h=600&fit=crop&q=80",
  tent_ultralight:
    "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=600&h=600&fit=crop&q=80",
  sleeping_bag:
    "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&h=600&fit=crop&q=80",
  sleeping_pad:
    "https://images.unsplash.com/photo-1602524816890-8fdb29c1fe68?w=600&h=600&fit=crop&q=80",
  backpack_large:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80",
  backpack_day:
    "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=600&h=600&fit=crop&q=80",
  trekking_pole:
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=600&fit=crop&q=80",
  hiking_boot:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80",
  sandal_outdoor:
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&h=600&fit=crop&q=80",
  headlamp:
    "https://images.unsplash.com/photo-1606207479835-cd4befc36c1e?w=600&h=600&fit=crop&q=80",
  lantern:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop&q=80",
  stove_camping:
    "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&h=600&fit=crop&q=80",
  cookset:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80",
  water_filter:
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&q=80",
  water_bottle:
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop&q=80",
  hammock:
    "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=600&fit=crop&q=80",
  knife_multi:
    "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&h=600&fit=crop&q=80",
  first_aid:
    "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&h=600&fit=crop&q=80",
  rain_jacket:
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop&q=80",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const USERS = [
  {
    name: "Admin WildCamp",
    email: "admin@wildcamp.vn",
    password: "password123",
    role: "admin",
    phone: "0901000001",
  },
  {
    name: "Super Admin",
    email: "superadmin@wildcamp.vn",
    password: "password123",
    role: "admin",
    phone: "0901000002",
  },
  {
    name: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345601",
  },
  {
    name: "Trần Thị Bình",
    email: "tranthibinh@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345602",
  },
  {
    name: "Lê Hoàng Cường",
    email: "lehoangcuong@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345603",
  },
  {
    name: "Phạm Thị Dung",
    email: "phamthidung@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345604",
  },
  {
    name: "Hoàng Minh Đức",
    email: "hoangminhduc@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345605",
  },
  {
    name: "Vũ Thị Hoa",
    email: "vuthihoa@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345606",
  },
  {
    name: "Đặng Quốc Hùng",
    email: "dangquochung@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345607",
  },
  {
    name: "Bùi Ngọc Linh",
    email: "buingoclinh@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0912345608",
  },
];

const CATEGORIES = [
  "Lều Trại",
  "Túi Ngủ",
  "Đệm Ngủ & Thảm Cắm Trại",
  "Ba Lô Trekking",
  "Ba Lô Du Lịch Nhỏ",
  "Giày Leo Núi",
  "Dép Dã Ngoại",
  "Gậy Trekking",
  "Đèn Pin & Đèn Đầu",
  "Đèn Lồng Cắm Trại",
  "Bếp & Nồi Cắm Trại",
  "Bộ Nấu Ăn Dã Ngoại",
  "Lọc & Bình Nước",
  "Võng Dã Ngoại",
  "Dao & Dụng Cụ Đa Năng",
  "Sơ Cứu & Y Tế",
  "Áo Khoác Chống Mưa",
  "Quần Áo Trekking",
  "Phụ Kiện Cắm Trại",
  "Thiết Bị Định Hướng",
];

const PRODUCTS = [
  // ── Lều Trại ──────────────────────────────────────────────────────────────
  {
    name: "Lều Cắm Trại 2 Người WildCamp Pro",
    category: "Lều Trại",
    price: 1_250_000,
    stock: 35,
    rating: 4.8,
    image: IMG.tent_dome,
    description:
      "Lều dome 2 lớp chống nước IPX4, khung hợp kim nhôm siêu nhẹ, thông gió tốt. Dựng nhanh trong 5 phút, trọng lượng chỉ 1.8kg, lý tưởng cho trekking và cắm trại cuối tuần.",
  },
  {
    name: "Lều Gia Đình 4-6 Người CampFamily XL",
    category: "Lều Trại",
    price: 2_890_000,
    stock: 18,
    rating: 4.6,
    image: IMG.tent_family,
    description:
      "Lều cabin rộng 2 phòng riêng biệt, cửa sổ lưới thoáng khí, chịu gió cấp 8. Diện tích sàn 12m², phù hợp cho cả gia đình nghỉ dưỡng dài ngày ngoài trời.",
  },
  {
    name: "Lều Siêu Nhẹ UltraLight Solo 1 Người",
    category: "Lều Trại",
    price: 980_000,
    stock: 42,
    rating: 4.7,
    image: IMG.tent_ultralight,
    description:
      "Lều 1 người dành cho dân trekking đường dài, chỉ nặng 900g. Vải silnylon chống nước hoàn toàn, thiết kế khí động học chống gió mạnh đến cấp 10.",
  },
  // ── Túi Ngủ ───────────────────────────────────────────────────────────────
  {
    name: "Túi Ngủ Lông Vũ -5°C DownSleep 700",
    category: "Túi Ngủ",
    price: 1_480_000,
    stock: 50,
    rating: 4.9,
    image: IMG.sleeping_bag,
    description:
      "Túi ngủ nhân lông vũ 700-fill power, nhiệt độ thoải mái -5°C. Hình dáng mummy ôm sát giữ nhiệt tối ưu, khoá YKK 2 chiều, cuộn gọn vào túi nhỏ hơn chai nước.",
  },
  // ── Đệm Ngủ & Thảm ────────────────────────────────────────────────────────
  {
    name: "Đệm Tự Phồng NatureSleep 4cm",
    category: "Đệm Ngủ & Thảm Cắm Trại",
    price: 620_000,
    stock: 60,
    rating: 4.5,
    image: IMG.sleeping_pad,
    description:
      "Đệm tự phồng foam mở, dày 4cm, R-value 3.2 phù hợp 3 mùa. Van khí 2 chiều tiện lợi, bề mặt chống trơn trượt, gấp gọn nhỏ bằng chai nước 1 lít.",
  },
  // ── Ba Lô Trekking ─────────────────────────────────────────────────────────
  {
    name: "Ba Lô Trekking 65L TrailMaster Pro",
    category: "Ba Lô Trekking",
    price: 1_750_000,
    stock: 28,
    rating: 4.7,
    image: IMG.backpack_large,
    description:
      "Ba lô khung cứng 65L với hệ thống điều chỉnh lưng Vari-Form, đai hông đệm dày, ngăn đựng túi ngủ riêng. Vải Cordura 420D bền bỉ, chịu được hành trình 7-10 ngày.",
  },
  {
    name: "Ba Lô Leo Núi 45L SummitPack",
    category: "Ba Lô Trekking",
    price: 1_190_000,
    stock: 33,
    rating: 4.6,
    image: IMG.backpack_large,
    description:
      "Ba lô 45L cho hành trình 3-5 ngày, khung nhôm nội tích, lưng lưới thông khí AirFlow. Nhiều ngăn tiện lợi, túi uống nước 2L tích hợp, khoá chống nước toàn bộ.",
  },
  // ── Ba Lô Du Lịch Nhỏ ─────────────────────────────────────────────────────
  {
    name: "Ba Lô Ngày DayHiker 20L",
    category: "Ba Lô Du Lịch Nhỏ",
    price: 490_000,
    stock: 75,
    rating: 4.4,
    image: IMG.backpack_day,
    description:
      'Ba lô 20L nhẹ chỉ 400g, dành cho các chuyến leo núi ngày, du lịch đô thị. Lưng thoáng khí, ngăn laptop 15", thiết kế gập phẳng khi không dùng.',
  },
  // ── Giày Leo Núi ──────────────────────────────────────────────────────────
  {
    name: "Giày Trekking Mid-Cut GoreTex TrailBoot",
    category: "Giày Leo Núi",
    price: 1_850_000,
    stock: 40,
    rating: 4.8,
    image: IMG.hiking_boot,
    description:
      "Giày trekking cổ trung với màng Gore-Tex chống nước tuyệt đối, đế Vibram grippy bám đa địa hình. Lót giày EVA giảm chấn, cổ chân ôm vừa không gây đau.",
  },
  // ── Gậy Trekking ──────────────────────────────────────────────────────────
  {
    name: "Gậy Trekking Carbon Nhẹ FlexPole Z",
    category: "Gậy Trekking",
    price: 880_000,
    stock: 55,
    rating: 4.6,
    image: IMG.trekking_pole,
    description:
      "Bộ 2 gậy sợi carbon siêu nhẹ, gấp 3 đoạn trong 2 giây. Tay cầm cork tự nhiên thấm mồ hôi, đầu tungsten cứng, tương thích cả đĩa cát và đĩa tuyết.",
  },
  // ── Đèn Pin & Đèn Đầu ─────────────────────────────────────────────────────
  {
    name: "Đèn Đầu LED 350 Lumen NightTrail Pro",
    category: "Đèn Pin & Đèn Đầu",
    price: 350_000,
    stock: 90,
    rating: 4.7,
    image: IMG.headlamp,
    description:
      "Đèn đầu 350 lumen 3 chế độ sáng (mạnh/tiết kiệm/đỏ đêm), chống nước IPX6, pin sạc USB-C tích hợp. Dây đeo điều chỉnh được, góc chiếu -30°~+30°.",
  },
  {
    name: "Đèn Lồng Cắm Trại LED GlowCamp 500lm",
    category: "Đèn Lồng Cắm Trại",
    price: 420_000,
    stock: 65,
    rating: 4.5,
    image: IMG.lantern,
    description:
      "Đèn lồng LED 500 lumen có thể điều chỉnh độ sáng, pin sạc 10.000mAh dùng 20h liên tục. Móc treo tiện lợi, gập nhỏ bằng ly nước, chống nước IPX4.",
  },
  // ── Bếp & Nồi ─────────────────────────────────────────────────────────────
  {
    name: "Bếp Gas Mini Ultralight CampStove Ti",
    category: "Bếp & Nồi Cắm Trại",
    price: 560_000,
    stock: 48,
    rating: 4.8,
    image: IMG.stove_camping,
    description:
      "Bếp cắm trại titanium chỉ nặng 56g, đun sôi 1L nước trong 2 phút 45 giây. Đầu vặn điều chỉnh lửa chính xác, phù hợp cả bình gas MSR và Jetboil.",
  },
  {
    name: "Bộ Nồi Nấu Hợp Kim CookSet 4 Món",
    category: "Bộ Nấu Ăn Dã Ngoại",
    price: 720_000,
    stock: 38,
    rating: 4.6,
    image: IMG.cookset,
    description:
      "Bộ 4 món: nồi 1.5L, nồi 1L, chảo, tay cầm silicone. Hợp kim nhôm anod hoá cứng không dính, lồng vào nhau gọn gàng, tổng trọng lượng 380g.",
  },
  // ── Lọc & Bình Nước ───────────────────────────────────────────────────────
  {
    name: "Bình Lọc Nước Dã Ngoại LifeStraw Peak",
    category: "Lọc & Bình Nước",
    price: 890_000,
    stock: 52,
    rating: 4.9,
    image: IMG.water_filter,
    description:
      "Bình lọc 1L tích hợp màng lọc hollow fiber 0.2 micron, loại bỏ 99.999% vi khuẩn và ký sinh trùng. Không cần pin, không cần hóa chất, uống thẳng từ suối an toàn.",
  },
  {
    name: "Bình Nước Giữ Nhiệt Titanium 750ml",
    category: "Lọc & Bình Nước",
    price: 380_000,
    stock: 80,
    rating: 4.5,
    image: IMG.water_bottle,
    description:
      "Bình titanium nguyên khối 750ml, giữ lạnh 24h / nóng 12h. Siêu nhẹ chỉ 135g, không mùi không vị, nắp twist-lock chống rỉ, an toàn đun trực tiếp trên bếp.",
  },
  // ── Võng ──────────────────────────────────────────────────────────────────
  {
    name: "Võng Dù Nhẹ HangPro Nylon 270cm",
    category: "Võng Dã Ngoại",
    price: 490_000,
    stock: 70,
    rating: 4.7,
    image: IMG.hammock,
    description:
      "Võng nylon ripstop siêu nhẹ 430g, dài 270cm rộng 140cm, tải trọng 200kg. Đai treo 3m x 2.5cm bảo vệ cây, dây carabiner aluminium, cuộn gọn bằng nắm tay.",
  },
  // ── Dao & Đa Năng ─────────────────────────────────────────────────────────
  {
    name: "Dao Đa Năng 12 Chức Năng Victorinox Style",
    category: "Dao & Dụng Cụ Đa Năng",
    price: 650_000,
    stock: 85,
    rating: 4.8,
    image: IMG.knife_multi,
    description:
      "12 chức năng trong 1: dao chính, cưa, tua vít, mở lon, kéo, nhíp, thước... Thép không gỉ 440C, cán inox chống rỉ, nặng chỉ 90g, thiết kế gọn nhét túi áo.",
  },
  // ── Sơ Cứu ────────────────────────────────────────────────────────────────
  {
    name: "Túi Sơ Cứu Dã Ngoại FirstAid 163 Món",
    category: "Sơ Cứu & Y Tế",
    price: 450_000,
    stock: 60,
    rating: 4.9,
    image: IMG.first_aid,
    description:
      "163 vật tư y tế đầy đủ trong túi vải chống nước nhỏ gọn: băng gạc, băng keo, kéo, nhíp, găng tay, thuốc sát khuẩn, hướng dẫn sơ cứu. Đạt chuẩn ANSI A-Plus.",
  },
  // ── Áo Khoác ──────────────────────────────────────────────────────────────
  {
    name: "Áo Khoác Chống Mưa 3 Lớp StormGuard Pro",
    category: "Áo Khoác Chống Mưa",
    price: 1_390_000,
    stock: 30,
    rating: 4.7,
    image: IMG.rain_jacket,
    description:
      "Áo khoác 3 lớp công nghệ 20,000mm chống nước / 20,000g thoát hơi. Đường may dán kín hoàn toàn, mũ điều chỉnh được, khóa kéo YKK chống nước, gấp gọn vào túi ngực.",
  },
  // ── Dép Dã Ngoại ──────────────────────────────────────────────────────────
  {
    name: "Dép Trekking Quick-Dry SandTrail Unisex",
    category: "Dép Dã Ngoại",
    price: 420_000,
    stock: 55,
    rating: 4.4,
    image: IMG.sandal_outdoor,
    description:
      "Dép dã ngoại đế EVA + cao su Vibram, khô nhanh trong 15 phút. Quai điều chỉnh 3 điểm ôm chân, chốt nhựa bền 50.000 lần đóng mở, phù hợp cả đi bộ và lội suối.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối!\n");

    // ── Xóa dữ liệu cũ ──
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
    ]);
    console.log("🗑️  Đã xóa dữ liệu cũ\n");

    // ── Tạo người dùng ──
    const users = await User.create(USERS);
    console.log(`👥 Đã tạo ${users.length} người dùng:`);
    users.forEach((u) =>
      console.log(`   [${u.role.padEnd(8)}] ${u.name} — ${u.email}`),
    );

    // ── Tạo danh mục ──
    const categories = await Category.insertMany(
      CATEGORIES.map((name) => ({ name })),
    );
    console.log(`\n📂 Đã tạo ${categories.length} danh mục:`);
    categories.forEach((c) => console.log(`   • ${c.name}`));

    // ── Tạo sản phẩm ──
    const products = await Product.insertMany(PRODUCTS);
    console.log(`\n📦 Đã tạo ${products.length} sản phẩm:`);
    products.forEach((p) =>
      console.log(
        `   [${p.category.padEnd(28)}] ${p.name} — ${p.price.toLocaleString("vi-VN")}đ`,
      ),
    );

    // ── Tổng kết ──
    console.log("\n" + "═".repeat(55));
    console.log("🎉 SEED HOÀN TẤT!");
    console.log("═".repeat(55));
    console.log(`  👥 Người dùng : ${users.length} (2 admin + 8 customer)`);
    console.log(`  📂 Danh mục   : ${categories.length}`);
    console.log(`  📦 Sản phẩm   : ${products.length}`);
    console.log("═".repeat(55));
    console.log("\n📋 Tài khoản mặc định:");
    console.log("  Admin   : admin@wildcamp.vn     / password123");
    console.log("  Admin   : superadmin@wildcamp.vn / password123");
    console.log("  Customer: nguyenvanan@gmail.com  / password123");
    console.log("  (và 7 customer khác — mật khẩu đều là password123)\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed:", err);
    process.exit(1);
  }
}

seed();
