const axios = require("axios");

async function sendWhatsAppNotification({ to, message }) {
  try {
    const token = process.env.FONNTE_TOKEN;

    const response = await axios.post(
      "https://api.fonnte.com/send",
      {
        target: to, // nomor tujuan, format internasional tanpa +, misal 6281234567890
        message,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );

    console.log("✅ Notifikasi WA terkirim:", response.data);
  } catch (err) {
    console.error("❌ Gagal kirim WA:", err.response?.data || err.message);
  }
}

module.exports = sendWhatsAppNotification;
