# Security

The Mini App validates Telegram WebApp `initData` server-side and derives the authenticated Telegram user from the signed payload. Order item prices are validated against the server-side catalog before an order is stored or sent to the administrator.
