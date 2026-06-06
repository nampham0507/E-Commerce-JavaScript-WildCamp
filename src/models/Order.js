const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, default: () => 'ORD' + Date.now() },
    customer: {
        name:    { type: String, required: true },
        phone:   { type: String, required: true },
        address: { type: String, required: true }
    },
    note: { type: String, default: '' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name:      String,
        price:     Number,
        image:     String,
        quantity:  { type: Number, default: 1 }
    }],
    total:         { type: Number, required: true },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: {
        type:    String,
        enum:    ['pending', 'paid', 'failed', 'N/A'],
        default: 'N/A'
    },
    status: {
        type:    String,
        enum:    ['Chờ xác nhận', 'Đã xác nhận', 'Đã hoàn thành', 'Đã hủy'],
        default: 'Chờ xác nhận'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
