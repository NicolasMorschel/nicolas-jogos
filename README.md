# Nicolas Jogos

Loja digital de jogos com React, Vite, TypeScript e Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

Depois abre:

```text
http://127.0.0.1:5173/index.html
```

## Build

```bash
npm run build
```

## Supabase

O app lê as variáveis abaixo quando existirem:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Se elas não existirem, ele usa a configuração pública do projeto atual.
