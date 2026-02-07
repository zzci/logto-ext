import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHandleSignInCallback } from '@logto/react';

export function CallbackPage() {
  const navigate = useNavigate();
  const { isLoading, error } = useHandleSignInCallback(() => {
    navigate('/profile', { replace: true });
  });

  useEffect(() => {
    if (error) {
      console.error('Sign in callback error:', error);
    }
  }, [error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">登录失败</h1>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <a href="/user" className="text-primary-600 hover:underline">
            返回首页
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">正在登录...</p>
        </div>
      </div>
    );
  }

  return null;
}
