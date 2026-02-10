## bookmarkz

A fast, cross‑platform bookmark dashboard that imports your messy Chromium bookmarks and turns them into a clean, searchable, animated interface you can use outside the browser’s default UX.

### Features

- **Chromium bookmark import**: Pull in existing bookmarks from Chromium‑based browsers instead of starting from scratch.
- **Organized views**: Browse bookmarks by folders with a layout optimized for quick scanning.
- **Search & filtering**: Quickly find links with full‑text style search and filters.
- **Keyboard‑friendly**: Built to be fast to navigate without leaving the keyboard.

### Tech Stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS 4**
- **Convex** with **Better Auth**
- **GSAP** for animations
- **Radix UI** primitives
- **Zustand** for client state

### Getting Started

- **Install dependencies**:

  ```bash
  pnpm install
  ```

- **Run the development server**:

  ```bash
  pnpm dev
  ```

  Then open `http://localhost:3000` in your browser.

- **Environment variables**:

  Copy the provided `example.env` file to `.env.local` and fill in the required values. This project requires environment variables for Convex, Better Auth, and optional third-party providers (e.g., GitHub). See `example.env` for the full list of variables and refer to the Convex documentation as needed. Ensure these are set before running the project.

### Scripts

- **`pnpm dev`** – Run the development server.
- **`pnpm build`** – Create a production build.
- **`pnpm start`** – Start the production server.
- **`pnpm lint`** – Run Biome checks.
- **`pnpm format`** – Format with Biome.

### License

This project is licensed under the **MIT License**. See `LICENSE` for details.
