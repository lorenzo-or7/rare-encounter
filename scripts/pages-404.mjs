#!/usr/bin/env node
/**
 * GitHub Pages serves static files only: opening /rare-encounter/encounter directly (or
 * reloading it) would hit Pages' 404. Pages serves `404.html` for any unknown path, so a
 * copy of the app's index.html there boots the app, and the router reads the real URL.
 *
 *   node scripts/pages-404.mjs   (run after `vite build --base=/rare-encounter/`)
 */
import { copyFileSync, existsSync } from 'node:fs';

if (!existsSync('dist/index.html')) throw new Error('dist/index.html not found: build first');
copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html written (SPA fallback for GitHub Pages)');
