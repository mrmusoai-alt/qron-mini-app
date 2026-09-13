import crypto from "node:crypto";

export function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) {
    throw new Error("Telegram authentication data is missing");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  const userRaw = params.get("user");

  if (!receivedHash || !userRaw || !Number.isFinite(authDate)) {
    throw new Error("Invalid Telegram authentication data");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");

  if (
    received.length !== calculated.length ||
    !crypto.timingSafeEqual(received, calculated)
  ) {
    throw new Error("Invalid Telegram signature");
  }

  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > maxAgeSeconds) {
    throw new Error("Telegram authentication data expired");
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new Error("Invalid Telegram user data");
  }

  if (!user?.id) {
    throw new Error("Telegram user is missing");
  }

  return user;
}
