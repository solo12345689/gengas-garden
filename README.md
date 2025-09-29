# 🌱 Gengas Garden v1.0.0

Gengas Garden — interactive globe + channels + player (TV Garden style).

## Local development
npm install
npm run dev

## Build for production
npm install
npm run build
npm run preview

## Deploy on Render (manual)
1. Create a new Static Site on Render or a Web Service.
2. Connect your GitHub repository.
3. Ensure Build Command is `npm install && npm run build`.
4. Set Publish Directory to `dist`.
5. Deploy.

## CI/CD: GitHub Actions → Render auto-deploy
1. In Render, go to your Service → Settings → Deploy Hooks → create a Deploy Hook and copy the URL.
2. In GitHub repo Settings → Secrets → Actions → add `RENDER_DEPLOY_HOOK` with the URL.
The workflow will trigger a curl POST to the hook after a successful build on pushes to main.

## Version History
- v1.0.0 — Initial release
