import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * SSO Callback Page
 * Handle redirect dari SSO setelah login berhasil
 */
const AuthCallbackPage = () => {
  console.log('===== [SSO Callback] COMPONENT RENDER START =====');
  console.log('[SSO Callback] Timestamp:', new Date().toISOString());
  console.log('[SSO Callback] window.location.href:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  console.log('[SSO Callback] window.location.pathname:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
  console.log('[SSO Callback] window.location.search:', typeof window !== 'undefined' ? window.location.search : 'N/A');
  
  const router = useRouter();
  const { login } = useAuth();

  // Log immediately untuk debugging
  console.log('[SSO Callback] Router isReady:', router.isReady);
  console.log('[SSO Callback] Router query:', router.query);
  console.log('[SSO Callback] Router pathname:', router.pathname);
  console.log('[SSO Callback] Router asPath:', router.asPath);
  console.log('===== [SSO Callback] COMPONENT RENDER END =====');

  useEffect(() => {
    console.log('\n===== [SSO Callback] useEffect START =====');
    console.log('[SSO Callback] useEffect triggered at:', new Date().toISOString());
    console.log('[SSO Callback] router.isReady =', router.isReady);
    console.log('[SSO Callback] router.query =', JSON.stringify(router.query));
    console.log('[SSO Callback] router.asPath =', router.asPath);

    const handleCallback = async () => {
      console.log('\n[SSO Callback] >>>>>> handleCallback function called');
      
      try {
        console.log('[SSO Callback] === STEP 1: Getting token from query ===');
        console.log('[SSO Callback] Full router.query object:', JSON.stringify(router.query, null, 2));
        
        // Get token dari URL query parameter
        const { token } = router.query;
        console.log('[SSO Callback] Token from query:', token ? 'EXISTS' : 'NULL');
        console.log('[SSO Callback] Token type:', typeof token);
        console.log('[SSO Callback] Query keys:', Object.keys(router.query));

        if (!token || typeof token !== 'string') {
          const error = 'Token tidak ditemukan';
          console.error('[SSO Callback] ❌ ERROR:', error);
          console.error('[SSO Callback] Available query params:', Object.keys(router.query));
          console.error('[SSO Callback] Query values:', router.query);
          throw new Error(error);
        }

        console.log('[SSO Callback] ✅ Token received successfully');
        console.log('[SSO Callback] Token preview:', token.substring(0, 30) + '...');
        console.log('[SSO Callback] Token length:', token.length);

        // Clear old token first
        console.log('[SSO Callback] === STEP 2: Clearing localStorage ===');
        const oldToken = localStorage.getItem('token');
        console.log('[SSO Callback] Old token exists:', !!oldToken);
        localStorage.removeItem('token');
        console.log('[SSO Callback] localStorage cleared');

        // Login dengan token - AuthContext akan verify dan sync user
        console.log('[SSO Callback] === STEP 3: Calling login function ===');
        console.log('[SSO Callback] About to call login with token...');
        await login(token);

        console.log('[SSO Callback] === STEP 4: Login completed successfully! ===');
        console.log('[SSO Callback] ✅✅✅ ALL STEPS COMPLETED ✅✅✅');

        // Redirect ke halaman utama (handled by AuthContext)
        // router.push('/') - already handled in login function
      } catch (error) {
        console.error('\n[SSO Callback] ❌❌❌ ERROR OCCURRED ❌❌❌');
        console.error('[SSO Callback] Error object:', error);
        console.error('[SSO Callback] Error stack:', error instanceof Error ? error.stack : 'No stack');
        console.error('[SSO Callback] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[SSO Callback] Error name:', error instanceof Error ? error.name : 'Unknown');
        
        // Redirect ke login page jika error
        console.log('[SSO Callback] Setting timeout for redirect...');
        setTimeout(() => {
          console.log('[SSO Callback] Timeout triggered, redirecting to login...');
          router.push('/login?error=auth_failed');
        }, 1000);
      }
    };

    // Only run when router is ready and has query params
    if (router.isReady) {
      console.log('[SSO Callback] ✅ Router is READY - executing handleCallback...');
      handleCallback();
    } else {
      console.log('[SSO Callback] ⏳ Router NOT ready yet, waiting...');
    }
    
    console.log('===== [SSO Callback] useEffect END =====\n');
  }, [router, router.isReady, router.query, login]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Mengautentikasi...
        </h2>
        <p className="text-dark-300">
          Mohon tunggu sebentar
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
