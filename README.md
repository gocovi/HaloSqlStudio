# Halo SQL Studio

## 🚀 Overview

Halo SQL Studio is a client-side SQL editor that connects to Halo PSA via their reporting API. It gives you the familiar experience of tools like DataGrip and SSMS without needing direct database access.

## ✨ Features

-   🔐 **OAuth Authentication** - Connect directly to your Halo instance
-   🗄️ **Database Explorer** - Browse tables, columns, and existing reports
-   📝 **SQL Query Editor** - Write and execute queries with syntax highlighting
-   📊 **Results Grid** - View results in a clean, sortable table format
-   🚫 **No Backend Required** - Everything runs in your browser

## 🛠️ Setup

### 1. Create Halo Application

1. Go to **Config > Integrations > Halo API** in your Halo instance
2. Note your **Resource Server** and **Authorization Server**
3. Click **View Applications** → **New**
4. Configure:
    - **Name**: Halo SQL Studio
    - **Auth Method**: Authorization Code (Native Application)
    - **Redirect URI**: `https://halosqlstudio.gocovi.dev/auth/callback`
    - **Permissions**: `read:reporting edit:reporting`
    - **Grant Types**: Authorization Code
    - **CORS Whitelist**: `https://halosqlstudio.gocovi.dev`

### 2. Configure App

1. Start Halo SQL Studio
2. Click **Configure** and enter:
    - **Tenant**: Your subdomain (e.g., `mymsp` for `mymsp.halopsa.com`)
    - **Auth Server**: Your Authorization Server URL
    - **Resource Server**: Your Resource Server URL
    - **Client ID**: From your Halo application details

### 3. Connect

1. Click **Connect to Halo**
2. Authorize in Halo
3. Start exploring!

## 🏠 Self-Hosting

Want to host Halo SQL Studio yourself? It's easy!

### Quick Deploy

1. **Fork this repository** on GitHub
2. **Deploy to your preferred platform:**
    - **Vercel**: Connect your fork and deploy with one click
    - **Netlify**: Connect your fork and deploy automatically
    - **GitHub Pages**: Enable in your fork's settings
    - **Any static host**: Build with `npm run build` and upload the `dist` folder

### Configuration

When self-hosting, update your Halo application's **Redirect URI** and **CORS Whitelist** to match your domain:

-   Redirect URI: `https://yourdomain.com/auth/callback`
-   CORS Whitelist: `https://yourdomain.com`

## 🔒 Security

All API calls happen directly from your browser. No data passes through external servers.

## 📄 License

MIT License - Open source and free to use.
