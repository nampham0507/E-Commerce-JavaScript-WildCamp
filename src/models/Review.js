const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const replySchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    text: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

const reviewSchema = new Schema({
    product:    { type: Types.ObjectId, ref: 'Product', required: true },
    user:       { type: Types.ObjectId, ref: 'User',    required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, default: '', maxlength: 1000 },
    // Legacy single admin reply — kept so old data still renders
    adminReply: { type: String, default: '' },
    // Conversation thread between admin and the review owner
    replies:    { type: [replySchema], default: [] },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
