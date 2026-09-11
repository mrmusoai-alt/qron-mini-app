export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!BOT_TOKEN) {
      return res.status(500).json({ error: "BOT_TOKEN не найден" });
    }

    if (!ADMIN_CHAT_ID) {
      return res.status(500).json({ error: "ADMIN_CHAT_ID не найден" });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({
        error: "Supabase переменные не найдены"
      });
    }

    // Сохраняем заказ в Supabase
    const dbResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          telegram_id: user.id,
          customer_name: customer?.name || "",
          phone: customer?.phone || "",
          comment: customer?.comment || "",
          items: order,
          total: Number(total) || 0,
          status: "Принят"
        })
      }
    );

    if (!dbResponse.ok) {
      const dbError = await dbResponse.text();

      console.error("Supabase error:", dbError);

      return res.status(500).json({
        error: "Не удалось сохранить заказ"
      });
    }

    // Текст для владельца
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

    // Отправляем владельцу в Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text
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
