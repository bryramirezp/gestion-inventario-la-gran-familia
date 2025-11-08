const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base CSP rules
const baseCSP = {
  'default-src': ["'self'"],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
  'block-all-mixed-content': []
};

// Development-specific rules (more permissive for debugging)
// Note: In development, we allow unsafe-inline for easier debugging
// All external CDN dependencies have been removed:
// - Google Fonts: Auto-hosted in public/fonts/ (loaded from 'self')
// - xlsx library: Loaded via npm and dynamic import (no CDN needed)
const developmentCSP = {
  ...baseCSP,
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"], // Fonts auto-hosted, no Google Fonts CDN
  'img-src': ["'self'", "data:", "https://*.supabase.co", "https://vercel.com", "https://*.vercel.app"],
  'connect-src': ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
};

// Production-specific rules (strict CSP compliant)
// No external CDN dependencies - all assets served from 'self'
// - Google Fonts: Auto-hosted in public/fonts/
// - xlsx library: Loaded via npm and dynamic import
// - Scripts: 'strict-dynamic' allows Vite-bundled scripts to load other scripts
const productionCSP = {
  ...baseCSP,
  'script-src': ["'self'", "'strict-dynamic'"], // No CDN scripts (xlsx loaded via npm)
  'style-src': ["'self'"], // No Google Fonts CDN (fonts auto-hosted)
  'font-src': ["'self'"], // Fonts auto-hosted, no Google Fonts CDN
  'img-src': ["'self'", "data:", "https://*.supabase.co", "https://vercel.com", "https://*.vercel.app"],
  'connect-src': ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
};

// Generate CSP string
function generateCSP(cspConfig) {
  return Object.entries(cspConfig)
    .map(([directive, sources]) => {
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

// Export appropriate CSP based on environment
export const getCSP = () => {
  const config = isDevelopment ? developmentCSP : productionCSP;
  return generateCSP(config);
};

// For Vercel deployment - you can also set this in vercel.json
export const vercelHeaders = {
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: getCSP()
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()'
        }
      ]
    }
  ]
};

export default getCSP;