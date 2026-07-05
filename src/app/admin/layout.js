'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1920',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1920',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920',
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920',
];

function AdminBackground() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIdx(prev => (prev + 1) % BG_IMAGES.length), 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {BG_IMAGES.map((img, i) => (
        <div
          key={i}
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 2s ease-in-out, transform 6s ease-out',
            transform: i === idx ? 'scale(1.05)' : 'scale(1)',
            filter: 'blur(24px) saturate(0.7)',
          }}
          className="absolute inset-0"
        />
      ))}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(12,10,26,0.9) 0%, rgba(12,10,26,0.6) 40%, rgba(12,10,26,0.7) 70%, rgba(12,10,26,0.95) 100%)',
        }}
        className="absolute inset-0"
      />
    </div>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && pathname !== '/admin/login' && pathname !== '/admin/register') {
      router.replace('/admin/login');
      return;
    }
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch {
        localStorage.removeItem('token');
        if (pathname !== '/admin/login') router.replace('/admin/login');
      }
    }
    setLoading(false);
  }, [pathname]);

  if (loading) return null;
  if (!user && pathname !== '/admin/login' && pathname !== '/admin/register') return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AdminBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
