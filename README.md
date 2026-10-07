# Chronically On Web ($COW)

Official website for **$COW — Chronically On Web**, a Solana memecoin about a cow who is
browsing, posting, researching, overthinking… and still online.

## Features

- Procedurally modelled, fully animated **3D cow** (Three.js) — breathing, blinking, cursor tracking,
  wave / wink / nod / dance / type / jump / spin / happy / sleepy emotes
- **Live stream** section with interactive emotes, reactions and a chat that controls the cow
- **COW OS** desktop with draggable apps: Browsing, Posting, Researching, Overthinking,
  Still Online, Analytics, Terminal
- Tokenomics, how to buy, roadmap, socials
- Zero build step — plain HTML / CSS / ES modules

## Run locally

Any static server works, e.g.

```bash
npx http-server -p 5173
```

then open http://localhost:5173

## Configure

Edit the `TOKEN` object at the top of `js/main.js`: contract address, launch date and social links.
