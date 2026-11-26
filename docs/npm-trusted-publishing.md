# npm Trusted Publishing (без TOTP на каждый релиз)

Цель: публиковать `defectdojo-http-api-mcp` из GitHub Actions по OIDC.
Локальный `npm publish` с 2FA на аккаунте **всегда** может спросить OTP —
это нормально. Для рутины используем CI.

Связанный changelog: [npm install-time security and GAT bypass2fa deprecation](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/).

## Текущее состояние registry

После первого stage через браузер на npm часто появляется только placeholder:

- `0.0.0-stage` в `dist-tags.latest`
- реальный `0.1.0` появляется **после** approve staged package **или** прямого `npm publish` через trusted publisher

Проверка: `npm view defectdojo-http-api-mcp version`

## One-time: Trusted Publisher на npmjs.com

1. Открой https://www.npmjs.com/package/defectdojo-http-api-mcp → **Settings** → **Trusted Publisher**.
2. **GitHub Actions**:
   - Organization or user: `rkorablin`
   - Repository: `defectdojo-http-api-mcp`
   - Workflow filename: `publish.yml` (только имя файла)
   - Environment: пусто (пока не используем GitHub Environment)
3. **Allowed actions:** включи **`npm publish`** (иначе CI сможет только `stage publish`, а approve снова потребует 2FA в браузере).
4. Сохрани. Конфиг должен получить **первый успешный publish в течение 2 дней**, иначе истечёт.

Альтернатива CLI (нужен npm ≥ 11.15 и интерактивный логин с 2FA один раз):

```bash
npm install -g 'npm@^11.15.0'
npm trust add github \
  --repo rkorablin/defectdojo-http-api-mcp \
  --workflow publish.yml \
  --allow-publish \
  --package defectdojo-http-api-mcp
```

## Релиз (после настройки trust)

```bash
cd ~/ai/defectdojo-http-api-mcp
# версия в package.json уже 0.1.0 (или bump)
git tag v0.1.0
git push origin v0.1.0
git push github v0.1.0   # workflow живёт на GitHub
```

Workflow: `.github/workflows/publish.yml` → `npm test` → `npm publish --access public` по OIDC.
TOTP не нужен.

## Если нужен только stage (строже)

Trusted publisher с **только** `npm stage publish` → CI кладёт пакет в staging →
ты один раз жмёшь Approve на npmjs (с 2FA). Для «не спрашивать каждый раз» —
не подходит; выбирай allow **`npm publish`**.

## Локально

- `~/.npmrc` token — для `npm whoami` / редких ручных операций.
- Не полагайся на GAT with bypass 2FA для publish (путь сворачивают).
- После стабильной работы trusted publishing можно в Settings пакета включить
  «Require 2FA and disallow tokens» — publish останется только через OIDC.
