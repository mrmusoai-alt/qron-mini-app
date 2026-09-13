import { verifyTelegramInitData } from "../lib/telegram-auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!BOT_TOKEN) {
      return res.status(500).json({ error: "BOT_TOKEN не найден" });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase переменные не найдены" });
    }

    const initData = req.headers["x-telegram-init-data"];
    let user;

    try {
      user = verifyTelegramInitData(initData, BOT_TOKEN);
    } catch (error) {
      return res.status(401).json({
        error: "Не удалось подтвердить Telegram-пользователя"
      });
    }

    const telegramId = String(user.id);
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?telegram_id=eq.${encodeURIComponent(telegramId)}&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Не удалось получить историю заказов"
      });
    }

    const orders = await response.json();

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}
