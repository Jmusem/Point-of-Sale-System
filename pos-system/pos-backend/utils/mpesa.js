const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortCode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

// Format phone number to 2547XXXXXXXX
const formatPhone = (phone) => {
  const cleaned = phone.replace(/[^0-9]/g, ''); // Remove all non-digits
  if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('7')) return '254' + cleaned;
  return cleaned; // fallback, but not ideal
};

// Get access token
const getToken = async () => {
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` }
  });

  return res.data.access_token;
};

// Initiate STK Push
const initiateStkPush = async (phone, amount) => {
  try {
    const token = await getToken();

    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const formattedPhone = formatPhone(phone);

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "POS Checkout",
      TransactionDesc: "Purchase at POS"
    };

    const res = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ STK Push initiated:', res.data);
  } catch (err) {
    console.error('❌ STK Push failed:', err?.response?.data || err.message);
  }
};

module.exports = initiateStkPush;
