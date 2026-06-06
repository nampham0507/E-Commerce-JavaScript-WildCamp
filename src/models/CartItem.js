const { Schema, model, Types } = require('mongoose');

const cartItemSchema = new Schema({
  cart:     { type: Types.ObjectId, ref: 'Cart',    required: true },
  product:  { type: Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 }
}, { timestamps: true });

// Đảm bảo mỗi sản phẩm chỉ xuất hiện 1 lần trong 1 giỏ hàng
cartItemSchema.index({ cart: 1, product: 1 }, { unique: true });

module.exports = model('CartItem', cartItemSchema);
