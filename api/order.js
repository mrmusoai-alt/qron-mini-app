import { verifyTelegramInitData } from "../lib/telegram-auth.js";
import { validateOrderItems } from "../lib/catalog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!BOT_TOKEN) return res.status(500).json({ error: "BOT_TOKEN не найден" });
    if (!ADMIN_CHAT_ID) return res.status(500).json({ error: "ADMIN_CHAT_ID не найден" });
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase переменные не найдены" });
    }

    let user;
    try {
      user = verifyTelegramInitData(req.headers["x-telegram-init-data"], BOT_TOKEN);
    } catch {
      return res.status(401).json({ error: "Не удалось подтвердить Telegram-пользователя" });
    }

    const { order, customer } = req.body || {};

    let validated;
    try {
      validated = validateOrderItems(order);
    } catch (error) {
      return res.status(400).json({ error: error.message || "Некорректный заказ" });
    }

    const { items, total } = validated;
    const safeCustomer = {
      name: typeof customer?.name === "string" ? customer.name.trim().slice(0, 100) : "",
      phone: typeof customer?.phone === "string" ? customer.phone.trim().slice(0, 50) : "",
      comment: typeof customer?.comment === "string" ? customer.comment.trim().slice(0, 500) : ""
    };

    if (!safeCustomer.name || !safeCustomer.phone) {
      return res.status(400).json({ error: "Введите имя и номер телефона" });
    }

    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        telegram_id: user.id,
        customer_name: safeCustomer.name,
        phone: safeCustomer.phone,
        comment: safeCustomer.comment,
        items,
        total,
        status: "Принят"
      })
    });

    if (!dbResponse.ok) {
      console.error("Supabase error:", await dbResponse.text());
      return res.status(500).json({ error: "Не удалось сохранить заказ" });
    }

    let text = "🛒 НОВЫЙ ЗАКАЗ QRON\n\n";
    items.forEach((item) => {
      text += `🍴 ${item.name} × ${item.quantity} — ${item.price * item.quantity} ₸\n`;
    });
    text += `\n💰 Итого: ${total} ₸`;
    text += `\n\n👤 Имя: ${safeCustomer.name}`;
    text += `\n📞 Телефон: ${safeCustomer.phone}`;
    if (safeCustomer.comment) text += `\n💬 Комментарий: ${safeCustomer.comment}`;
    if (user.first_name) text += `\n\n📱 Telegram: ${user.first_name}`;
    if (user.username) text += `\n🔗 @${user.username}`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text })
    });
    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram error:", telegramData.description);
      return res.status(500).json({ error: "Telegram не принял заказ" });
    }

    return res.status(200).json({ success: true, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}
