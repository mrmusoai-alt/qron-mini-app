export const PRODUCT_CATALOG = Object.freeze({
  MAX: 320,
  "Стандарт": 250,
  "Мини": 220,
  "Гранатовая": 290,
  "С креветкой": 360,
  "Мексикано": 260,
  "На тарелке": 300,
  "В сырном лаваше MAX": 320,
  "В сырном лаваше": 260,
  "Фирменная": 390,
  "Ролл куриный": 240,
  "Мясо в лаваше": 260,
  "Мясо в булке": 260,
  "Хот-дог": 200,
  "Хот-дог в лаваше": 180,
  "Хот-дог двойной": 220,
  "Донар": 280,
  "Гирос": 280,
  "Фахитос": 280,
  "Секпасти": 350,
  "Плов": 350,
  "Картошка фри": 140,
  "Наггетсы": 160,
  "Салат весенний": 100,
  "Салат летний": 150,
  "Фри": 30,
  "Мясо": 50,
  "Грибы": 30,
  "Халапеньо": 30,
  "Сыр": 30
});

export function validateOrderItems(order) {
  if (!Array.isArray(order) || order.length === 0 || order.length > 50) {
    throw new Error("Некорректный состав заказа");
  }

  const normalized = order.map((item) => {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const quantity = Number(item?.quantity);
    const price = PRODUCT_CATALOG[name];

    if (!name || price === undefined) {
      throw new Error(`Товар недоступен: ${name || "неизвестный товар"}`);
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new Error(`Некорректное количество для товара: ${name}`);
    }

    return { name, price, quantity };
  });

  const total = normalized.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return { items: normalized, total };
}
