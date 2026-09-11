export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: "BOT_TOKEN не найден"
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(200).json({
        ok: true
      });
    }

    const chatId = message.chat?.id;
    const text = message.text || "";

    if (text === "/start") {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              "👋 Добро пожаловать в QRON!\n\n" +
              "🌯 Вкусная еда — быстро и удобно 😋\n\n" +
              "🍴 Выбирай любимые блюда\n" +
              "🛒 Добавляй в корзину\n" +
              "🚀 Оформляй заказ прямо в Telegram\n\n" +
              "Нажми кнопку «🍴 Открыть QRON» и начинай выбирать 👇",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🍴 Открыть QRON",
                    web_app: {
                      url: "https://qron-mini-app.vercel.app"
                    }
                  }
                ]
              ]
            }
          })
        }
      );
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Ошибка сервера"
    });
  }
}
