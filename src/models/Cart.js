const { Schema, model, Types } = require('mongoose');

const cartSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true });

module.exports = model('Cart', cartSchema);
