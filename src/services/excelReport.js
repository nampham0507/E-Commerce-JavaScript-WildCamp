const ExcelJS = require('exceljs');

function border(color = 'FFD0D0D0') {
  const s = { style: 'thin', color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

function styleHeader(cell, bgArgb) {
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = border('FF888888');
}

function styleData(cell, bgArgb, align = 'left', bold = false) {
  cell.font = { size: 10, name: 'Calibri', bold };
  if (bgArgb) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.alignment = { horizontal: align, vertical: 'middle' };
  cell.border = border();
}

function addSheetTitle(ws, title, subtitle, cols) {
  ws.mergeCells(1, 1, 1, cols);
  const r1c1 = ws.getRow(1).getCell(1);
  r1c1.value = title;
  r1c1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  r1c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
  r1c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 34;

  ws.mergeCells(2, 1, 2, cols);
  const r2c1 = ws.getRow(2).getCell(1);
  r2c1.value = subtitle;
  r2c1.font = { size: 10, italic: true, color: { argb: 'FF444444' }, name: 'Calibri' };
  r2c1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 6;
}

const fmtMoney = n => Number(n || 0).toLocaleString('vi-VN');
const fmtDate  = d => new Date(d).toLocaleDateString('vi-VN');

async function generateReport({ fromStr, toStr, dateFrom, dateTo, summary, dailyRevenue, topProducts, lowStock, orders }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'WildCamp';
  wb.company = 'WildCamp - Lều Trại & Đồ Dã Ngoại Cao Cấp';
  wb.created = new Date();

  const now = new Date();
  const periodLabel = `Kỳ báo cáo: ${fmtDate(dateFrom)} — ${fmtDate(dateTo)}`;

  // ─── Sheet 1: Tổng Quan ────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Tổng Quan', { properties: { tabColor: { argb: 'FF2D6A4F' } } });
  [38, 32].forEach((w, i) => { ws1.getColumn(i + 1).width = w; });

  ws1.mergeCells('A1:B1');
  const hdr = ws1.getRow(1).getCell(1);
  hdr.value = 'WILDCAMP — BÁO CÁO KINH DOANH';
  hdr.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
  hdr.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 42;

  ws1.mergeCells('A2:B2');
  const sub = ws1.getRow(2).getCell(1);
  sub.value = 'Lều Trại & Đồ Dã Ngoại Cao Cấp';
  sub.font = { size: 11, italic: true, color: { argb: 'FF2D6A4F' }, name: 'Calibri' };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(2).height = 24;
  ws1.getRow(3).height = 10;

  [
    ['Kỳ báo cáo:', `${fmtDate(dateFrom)} — ${fmtDate(dateTo)}`],
    ['Ngày xuất báo cáo:', fmtDate(now)],
    ['Giờ xuất:', now.toLocaleTimeString('vi-VN')],
  ].forEach(([label, val], i) => {
    const row = ws1.getRow(4 + i);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF555555' } };
    row.getCell(2).value = val;
    row.getCell(2).font = { size: 10, name: 'Calibri' };
    row.height = 20;
  });

  ws1.getRow(7).height = 12;

  ws1.mergeCells('A8:B8');
  const kpiHdr = ws1.getRow(8).getCell(1);
  kpiHdr.value = 'CHỈ SỐ KINH DOANH TỔNG QUAN';
  kpiHdr.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  kpiHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
  kpiHdr.alignment = { horizontal: 'center', vertical: 'middle' };
  kpiHdr.border = border();
  ws1.getRow(8).height = 26;

  const kpis = [
    ['Tổng doanh thu', fmtMoney(summary.totalRevenue) + ' đ'],
    ['Tổng số đơn hàng', summary.orderCount + ' đơn'],
    ['Giá trị đơn trung bình', fmtMoney(summary.avgOrderValue) + ' đ'],
    ['Tổng sản phẩm đã bán', summary.totalItemsSold + ' sản phẩm'],
    ['Sản phẩm tồn kho thấp (< 10)', lowStock.length + ' sản phẩm'],
  ];
  kpis.forEach(([label, val], i) => {
    const row = ws1.getRow(9 + i);
    const bg = i % 2 === 0 ? 'FFF9F9F9' : 'FFFFFFFF';
    const c1 = row.getCell(1); c1.value = label;
    const c2 = row.getCell(2); c2.value = val;
    styleData(c1, bg, 'left', true);
    styleData(c2, bg, 'right');
    row.height = 22;
  });

  // ─── Sheet 2: Doanh Thu Theo Ngày ─────────────────────────────────────────
  const ws2 = wb.addWorksheet('Doanh Thu Theo Ngày', { properties: { tabColor: { argb: 'FF40916C' } } });
  [18, 20, 28].forEach((w, i) => { ws2.getColumn(i + 1).width = w; });
  addSheetTitle(ws2, 'DOANH THU THEO NGÀY', periodLabel, 3);

  ['Ngày', 'Số đơn hàng', 'Doanh thu (VNĐ)'].forEach((h, i) => {
    const cell = ws2.getRow(4).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, 'FF2D6A4F');
  });
  ws2.getRow(4).height = 24;

  dailyRevenue.forEach((d, i) => {
    const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5FAF7';
    const row = ws2.addRow([fmtDate(d.date), d.count, d.revenue]);
    styleData(row.getCell(1), bg, 'center');
    styleData(row.getCell(2), bg, 'center');
    styleData(row.getCell(3), bg, 'right');
    row.getCell(3).numFmt = '#,##0';
    row.height = 20;
  });

  if (dailyRevenue.length > 0) {
    const tot = ws2.addRow(['Tổng cộng', summary.orderCount, summary.totalRevenue]);
    [0, 1, 2].forEach(i => {
      const c = tot.getCell(i + 1);
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
      c.alignment = { horizontal: i === 0 ? 'left' : i === 1 ? 'center' : 'right', vertical: 'middle' };
      c.border = border();
      if (i === 2) c.numFmt = '#,##0';
    });
    tot.height = 24;
  }

  // ─── Sheet 3: Sản Phẩm Bán Chạy ──────────────────────────────────────────
  const ws3 = wb.addWorksheet('Sản Phẩm Bán Chạy', { properties: { tabColor: { argb: 'FFB7770D' } } });
  [8, 42, 18, 28, 18].forEach((w, i) => { ws3.getColumn(i + 1).width = w; });
  addSheetTitle(ws3, 'SẢN PHẨM BÁN CHẠY & DOANH THU', periodLabel, 5);

  ['STT', 'Tên sản phẩm', 'Số lượng bán', 'Doanh thu (VNĐ)', '% Tổng DT'].forEach((h, i) => {
    const cell = ws3.getRow(4).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, 'FFB7770D');
  });
  ws3.getRow(4).height = 24;

  topProducts.forEach((p, i) => {
    const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFFEF9F0';
    const row = ws3.addRow([i + 1, p.name, p.totalQty, p.totalRevenue, p.pct + '%']);
    const aligns = ['center', 'left', 'center', 'right', 'center'];
    row.eachCell((cell, col) => {
      styleData(cell, bg, aligns[col - 1]);
      if (col === 4) cell.numFmt = '#,##0';
    });
    row.height = 20;
  });

  if (topProducts.length === 0) {
    ws3.addRow(['', 'Không có dữ liệu bán hàng trong kỳ báo cáo', '', '', '']);
  }

  // ─── Sheet 4: Cảnh Báo Tồn Kho ───────────────────────────────────────────
  const ws4 = wb.addWorksheet('Cảnh Báo Tồn Kho', { properties: { tabColor: { argb: 'FF922B21' } } });
  [8, 42, 22, 16, 22].forEach((w, i) => { ws4.getColumn(i + 1).width = w; });
  addSheetTitle(ws4, 'CẢNH BÁO TỒN KHO THẤP (< 10 sản phẩm)', `Ngày kiểm tra: ${fmtDate(now)}`, 5);

  ['STT', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Trạng thái'].forEach((h, i) => {
    const cell = ws4.getRow(4).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, 'FF922B21');
  });
  ws4.getRow(4).height = 24;

  lowStock.forEach((p, i) => {
    const status = p.stock === 0 ? 'HẾT HÀNG' : p.stock <= 3 ? 'Nguy hiểm' : 'Cần nhập thêm';
    const bg = p.stock === 0 ? 'FFFADBD8' : p.stock <= 3 ? 'FFFDEBD0' : 'FFFFF3CD';
    const row = ws4.addRow([i + 1, p.name, p.category, p.stock, status]);
    const aligns = ['center', 'left', 'center', 'center', 'center'];
    row.eachCell((cell, col) => {
      styleData(cell, bg, aligns[col - 1], p.stock === 0);
      if (col === 5 && p.stock === 0) {
        cell.font = { bold: true, color: { argb: 'FF922B21' }, size: 10, name: 'Calibri' };
      }
    });
    row.height = 20;
  });

  if (lowStock.length === 0) {
    const ok = ws4.addRow(['', '✓ Tất cả sản phẩm đều còn đủ hàng', '', '', '']);
    ok.getCell(2).font = { color: { argb: 'FF196F3D' }, italic: true, size: 10 };
  }

  // ─── Sheet 5: Chi Tiết Đơn Hàng ──────────────────────────────────────────
  const ws5 = wb.addWorksheet('Chi Tiết Đơn Hàng', { properties: { tabColor: { argb: 'FF1F618D' } } });
  [22, 14, 22, 16, 38, 24, 18, 16].forEach((w, i) => { ws5.getColumn(i + 1).width = w; });
  addSheetTitle(ws5, 'CHI TIẾT ĐƠN HÀNG', periodLabel, 8);

  ['Mã đơn', 'Ngày đặt', 'Khách hàng', 'Số điện thoại', 'Địa chỉ', 'Tổng tiền (VNĐ)', 'Trạng thái', 'Thanh toán'].forEach((h, i) => {
    const cell = ws5.getRow(4).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, 'FF1F618D');
  });
  ws5.getRow(4).height = 24;

  const payLabel = { paid: 'VNPay - Đã TT', pending: 'Chờ thanh toán', failed: 'Thất bại', 'N/A': 'COD' };
  orders.forEach((o, i) => {
    const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF0F4FA';
    const row = ws5.addRow([
      o.orderCode,
      fmtDate(o.createdAt),
      o.customer.name,
      o.customer.phone,
      o.customer.address,
      o.total,
      o.status,
      payLabel[o.paymentStatus] || o.paymentStatus,
    ]);
    const aligns = ['center', 'center', 'left', 'center', 'left', 'right', 'center', 'center'];
    row.eachCell((cell, col) => {
      styleData(cell, bg, aligns[col - 1]);
      if (col === 6) cell.numFmt = '#,##0';
      if (col === 7) {
        if (o.status === 'Đã hủy') cell.font = { bold: true, color: { argb: 'FF922B21' }, size: 10, name: 'Calibri' };
        if (o.status === 'Đã hoàn thành') cell.font = { bold: true, color: { argb: 'FF196F3D' }, size: 10, name: 'Calibri' };
      }
    });
    row.height = 20;
  });

  if (orders.length > 0) {
    const grandTotal = orders.reduce((s, o) => s + o.total, 0);
    const tot = ws5.addRow(['', '', '', '', 'TỔNG CỘNG', grandTotal, '', '']);
    [5, 6].forEach(col => {
      const c = tot.getCell(col);
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
      c.alignment = { horizontal: col === 5 ? 'right' : 'right', vertical: 'middle' };
      c.border = border();
      if (col === 6) c.numFmt = '#,##0';
    });
    tot.height = 24;
  }

  return wb;
}

module.exports = { generateReport };
