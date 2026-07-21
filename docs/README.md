# web-have-sounds docs + playground

Nuxt 4 site for library documentation and an interactive playground.

## Develop

From the **repo root**:

```bash
npm run docs:dev
```

Or from this folder:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
docs/
  app/
    assets/css/base.css     # temporary shell styles
    components/             # (empty — design later)
    composables/useSounds.ts
    layouts/default.vue
    layouts/docs.vue
    pages/
      index.vue             # home
      playground/           # live lab
      docs/                 # documentation pages
    plugins/sounds.client.ts
  nuxt.config.ts            # aliases monorepo library source
```

The library is resolved from `../src/index.ts` so playground changes pick up local package edits without publishing.

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Nuxt dev server |
| `npm run build` | Production build |
| `npm run generate` | Static generate |
| `npm run preview` | Preview production build |

## Design

Visual system / content polish intentionally deferred. Tell the agent what you want next.
