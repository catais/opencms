# OpenCMS

OpenCMS is a premium, high-fidelity AI social-commerce management platform, rebuilt from the ground up as a modern Next.js, Node.js, and TypeScript replica of WordPress and WooCommerce. It utilizes Tailwind CSS, Remix Icons, and a Prisma-managed SQLite database workspace structure.

## Features

- **Zero-Configuration Database**: Uses a local SQLite database that auto-provisions via a beautiful 5-minute setup wizard.
- **Dynamic Themes & Plugins**: Easily upload and activate custom themes and plugins via the admin dashboard without rebuilding.
- **Full E-Commerce Capabilities**: Shopping cart, secure checkout, coupon validation, inventory management, and customer portal.
- **CMS Administration**: Manage blog posts, static pages, media assets, and users through a stunning glassmorphic admin interface.
- **Developer Tools**: Native API key generation, outgoing webhook dispatcher, and live execution retry logs.

---

## Quick Start (Recommended)

The fastest way to start building a new OpenCMS project is to use the official CLI tool. It will automatically download the repository, configure a fresh Git environment, set up your local environment variables, and install all dependencies.

Open your terminal and run:

```bash
npx @opencmsai/create-opencms@latest
```

Follow the beautiful interactive prompts to name your project. Once complete, navigate into your new directory and start the server:

```bash
cd <your-project-name>
npm run dev
```

The system will boot up. Open your web browser and navigate to:

**[http://localhost:3000](http://localhost:3000)**

---

## Manual Installation

If you prefer to install the repository manually:

### Prerequisites

Before starting, ensure your system has the following installed:
1. **Node.js**: Version 18.17.0 or higher. (Download from [nodejs.org](https://nodejs.org/))
2. **Git**: To clone the repository.

### Step 1: Download the Repository

Open your terminal or command prompt and clone the OpenCMS repository to your local machine:

```bash
git clone https://github.com/catais/opencms.git
cd opencms
```

### Step 2: Install Dependencies

OpenCMS is a monorepo containing multiple packages. Install all required packages using npm from the root directory:

```bash
npm install
```

### Step 3: Configure Environment Variables

OpenCMS requires a few basic environment variables to handle secure sessions.

1. Locate the `.env.example` file in the root directory.
2. Duplicate or rename this file to `.env` (or copy its contents into a new `.env` file).
3. Open the `.env` file in your code editor. You will see a `JWT_SECRET` key. Change this to a random string of characters to secure your sessions.

### Step 4: Start the Development Server

You are ready to launch! Start the Next.js development server:

```bash
npm run dev
```

The system will boot up. Open your web browser and navigate to:

**[http://localhost:3000](http://localhost:3000)**

---

### Step 5: The Setup Wizard

When you visit `http://localhost:3000` for the first time, OpenCMS will automatically detect that your database is empty. You will be instantly redirected to the **OpenCMS Setup Wizard** (`/install`).

> **Note**: You do not need to run Prisma schema commands or seeding scripts manually! The Setup Wizard will handle all database provisioning for you.

Follow the on-screen steps in your browser:
1. **Select your Language**.
2. **Read the Welcome card**.
3. **Information Needed**: Enter your desired Site Title, an Admin Email, a secure password, and your Admin Name.
4. **Install**: Click "Install OpenCMS". The system will automatically generate your SQLite database tables, seed the premium demo catalogs (products, pages, themes), and secure your custom administrator account.
5. **Success!**: Upon completion, use the provided links to visit your shiny new storefront, or log into the `/admin` dashboard using the credentials you just created.

---

## Troubleshooting

If you ever need to completely reset your system and start the setup wizard over:
1. Stop your development server (`Ctrl+C`).
2. Delete the local database file located at: `packages/database/prisma/dev.db`
3. Restart the server (`npm run dev`) and visit `http://localhost:3000` to trigger the installation wizard again.
