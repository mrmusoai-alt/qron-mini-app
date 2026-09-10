export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { order, total, userId } = req.body;

    if (!order || !total || !userId) {
      return res.status(400).json({
        error: "Missing order data"
      });
    }

    const token = process.env.BOT_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "BOT_TOKEN is not configured"
      });
    }

    const text =
      "🛒 НОВЫЙ ЗАКАЗ QRON\n\n" +
      order.map(item =>
        `${item.name} × ${item.quantity} — ${item.price * item.quantity} ₸`
      ).join("\n") +
      `\n\n💰 Итого: ${total} ₸` +
      `\n👤 Telegram ID: ${userId}`;

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: userId,
          text: text
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return res.status(500).json({
        error: result.description || "Telegram error"
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
