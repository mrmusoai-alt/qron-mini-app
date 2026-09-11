export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { order, total, user, customer } = req.body;

    if (!order || !Array.isArray(order) || !user?.id) {
      return res.status(400).json({
        error: "Недостаточно данных"
      });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: "BOT_TOKEN не найден"
      });
    }

    if (!ADMIN_CHAT_ID) {
      return res.status(500).json({
        error: "ADMIN_CHAT_ID не найден"
      });
    }

    let text = "🛒 НОВЫЙ ЗАКАЗ QRON\n\n";

    order.forEach((item) => {
      text += `🍴 ${item.name} × ${item.quantity} — ${
        item.price * item.quantity
      } ₸\n`;
    });

    text += `\n💰 Итого: ${total} ₸`;

    text += `\n\n👤 Имя: ${customer?.name || "Не указано"}`;

    text += `\n📞 Телефон: ${customer?.phone || "Не указан"}`;

    if (customer?.comment) {
      text += `\n💬 Комментарий: ${customer.comment}`;
    }

    if (user.first_name) {
      text += `\n\n📱 Telegram: ${user.first_name}`;
    }

    if (user.username) {
      text += `\n🔗 @${user.username}`;
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: text
        })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      return res.status(500).json({
        error: "Telegram не принял заказ",
        details: telegramData.description
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Ошибка сервера"
    });
  }
}
