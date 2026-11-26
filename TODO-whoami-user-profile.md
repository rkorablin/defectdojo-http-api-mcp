# TODO: `defectdojo_whoami` — identity через `/user_profile/`

**Статус:** выполнено · **Источник:** Cubekit greening / личный токен rkorablin · **2026-11-26**

## Проблема

Сейчас `defectdojo_whoami` бьёт только в `GET /api/v2/users/me/`, при ошибке —
fallback `auth: ok` + `products_count` без username.

На инстансе `http://defectdojo.it-aces.com` (и, вероятно, близких OSS-сборках):

| Токен | `GET /users/me/` | Identity |
|-------|------------------|----------|
| CI / service | часто **403** | fallback products-count (как сейчас) |
| Личный (staff/superuser) | **404** Not found | fallback снова — **ложное** ощущение «токен не тот» |

При этом **`GET /api/v2/user_profile/`** с личным токеном отдаёт 200 и пользователя.

Цель whoami для оператора: **видеть, что агент работает от его имени** после
замены `DEFECTDOJO_API_TOKEN` в `~/.config/ai-mcp/it-aces.env`.

## Требование

1. **Порядок probe identity** (первый успех побеждает):
   1. `GET /api/v2/user_profile/` — предпочитать; вернуть compact
   2. иначе `GET /api/v2/users/me/` — если 200
   3. иначе fallback: `products_count` + `source: products_fallback`

2. Не считать 404 на `/users/me/` доказательством «токен CI».

3. README / tool description обновлены.

4. Unit-тест: `user_profile` 200 → username; `/users/me` 404 не вытесняет profile.

## Acceptance

- [x] Личный токен: whoami показывает `username` из `user_profile` (не products-count fallback).
- [x] CI-токен без profile/me: `auth: ok` + `products_count` (`source: products_fallback`).
- [x] README + description tool обновлены.
- [x] Тест на порядок fallback (`resolveWhoamiIdentity`).

## Реализация

- `lib/defectdojo-helpers.mjs` — `resolveWhoamiIdentity`, `compactUserProfile`, `compactUsersMe`
- `server.mjs` — `case 'defectdojo_whoami'`
- `test/defectdojo-helpers.test.mjs`
