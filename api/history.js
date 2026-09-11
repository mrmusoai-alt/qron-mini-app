export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const telegramId = req.query.telegram_id;

    if (!telegramId) {
      return res.status(400).json({
        error: "telegram_id не указан"
      });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({
        error: "Supabase переменные не найдены"
      });
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?telegram_id=eq.${telegramId}&order=created_at.desc`,
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

    return res.status(500).json({
      error: "Ошибка сервера"
    });
  }
}
