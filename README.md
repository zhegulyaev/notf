# Трекер привычек: GitHub Pages + Supabase

## 1. Supabase
1. Создай проект на Supabase.
2. Открой SQL Editor.
3. Вставь весь `supabase.sql` и нажми Run.
4. В Project Settings → API возьми Project URL и публичный `anon`/publishable key.
5. Скопируй `config.example.js` в `config.js` и вставь эти два значения.

## 2. GitHub
Загрузи все файлы проекта в репозиторий.
В Settings → Pages выбери **GitHub Actions**.
После push в `main` сайт задеплоится автоматически.

## 3. Важно
- `config.js` содержит только публичный ключ Supabase.
- Никогда не помещай `service_role` key в frontend.
- RLS уже ограничивает строки текущим пользователем.
- Авторизация: email + пароль.
- Данные хранятся в Supabase и синхронизируются между устройствами.

## Если email требует подтверждения
В Supabase → Authentication → Providers/Email можно настроить подтверждение email. Для самого быстрого теста его можно отключить, а потом включить перед публичным использованием.
