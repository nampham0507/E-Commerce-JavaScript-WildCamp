const crypto = require('crypto');
const qs     = require('qs');

function formatDate(date) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

// Sort keys alphabetically and URL-encode both key & value (VNPay spec)
function sortObject(obj) {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  }
  return sorted;
}

function sign(data) {
  return crypto
    .createHmac('sha512', process.env.VNP_HASH_SECRET)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
}

/**
 * Build the VNPay payment redirect URL.
 * @param {string} txnRef   - Unique order reference (orderCode)
 * @param {number} amount   - Total amount in VND (integer)
 * @param {string} orderInfo
 * @param {string} ipAddr
 * @returns {string} Full VNPay payment URL
 */
exports.createPaymentUrl = function (txnRef, amount, orderInfo, ipAddr) {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  const date = new Date();

  const params = {
    vnp_Version:   '2.1.0',
    vnp_Command:   'pay',
    vnp_TmnCode:   process.env.VNP_TMN_CODE,
    vnp_Locale:    'vn',
    vnp_CurrCode:  'VND',
    vnp_TxnRef:    txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount:    amount * 100,
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_IpAddr:    ipAddr,
    vnp_CreateDate: formatDate(date),
  };

  const sorted   = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  sorted['vnp_SecureHash'] = sign(signData);

  return process.env.VNP_URL + '?' + qs.stringify(sorted, { encode: false });
};

/**
 * Verify the signature on the VNPay return/IPN callback.
 * @param {object} query - req.query from the callback
 * @returns {{ valid: boolean, responseCode: string, txnRef: string, amount: number }}
 */
exports.verifyReturn = function (query) {
  const params      = { ...query };
  const secureHash  = params['vnp_SecureHash'];
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted   = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  const valid    = secureHash === sign(signData);

  return {
    valid,
    responseCode: query['vnp_ResponseCode'],
    txnRef:       query['vnp_TxnRef'],
    amount:       parseInt(query['vnp_Amount'] || '0') / 100,
  };
};
