const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base CSP rules
const baseCSP = {
  'default-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
  'block-all-mixed-content': []
};

// Development-specific rules (more permissive for debugging)
const developmentCSP = {
  ...baseCSP,
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
};

// Production-specific rules (more restrictive)
const productionCSP = {
  ...baseCSP,
  'script-src': ["'self'", "https://cdnjs.cloudflare.com"],
  'style-src': ["'self'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
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