# UUC Solar ROI Calculator

A static Vite + React app that estimates the 25-year return on a solar system for the Unitarian
Universalists of Clearwater. Saved and shared configurations are stored in Firestore; sign-in is Google via
Firebase Auth.

Live site: https://benczech212.github.io/uuc_solar_calculator/

## Run locally

Prerequisites: Node.js 22.

1. `npm install`
2. `npm run dev` and open the URL Vite prints (http://localhost:5173/uuc_solar_calculator/).

`npm run build` writes the static site to `dist/` (served under `/uuc_solar_calculator/`); `npm run preview`
serves that build locally.

## Deploy

`.github/workflows/pages.yml` builds every push and pull request, and deploys `main` to GitHub Pages
(Settings → Pages → Source: GitHub Actions).

## Firebase

`firebase-applet-config.json` holds the Firebase web config. The web API key is a public identifier, not a
secret: access is controlled by `firestore.rules`, and the key should be restricted in Google Cloud to the
site's domains and the Firebase APIs.
