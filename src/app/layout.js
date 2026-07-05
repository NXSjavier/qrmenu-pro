import './globals.css';

export const metadata = {
  title: 'QRMenu Pro',
  description: 'Menú digital con QR para restaurantes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'QRMenu',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  themeColor: '#0c0a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-512.svg" />
      </head>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
