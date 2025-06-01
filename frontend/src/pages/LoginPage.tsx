import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input, LoadingSpinner } from '../components/UIElements';
import { BuildingOfficeIcon } from '../components/Icons';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState(''); // 手机号或邮箱
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (auth?.currentUser && !auth.isLoadingAuth) {
        navigate(from, { replace: true });
    }
  }, [auth?.currentUser, auth?.isLoadingAuth, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    if (!auth) {
      setError('认证服务不可用，请稍后再试。');
      setIsLoggingIn(false);
      return;
    }

    const result = await auth.login({ identifier, password });
    setIsLoggingIn(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || '账号或密码错误，请重试。');
    }
  };
  
  if (auth?.isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (auth?.currentUser) {
      return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <BuildingOfficeIcon className="mx-auto h-16 w-auto text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            登录智慧moma平台
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="手机号或邮箱"
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="请输入手机号或邮箱地址"
            required
            autoComplete="username"
          />
          <Input
            label="密码"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入您的密码"
            required
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}

          <div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
              variant="primary"
              size="lg"
            >
              {isLoggingIn ? <LoadingSpinner size="sm"/> : '登 录'}
            </Button>
          </div>
           <div className="text-sm text-center text-slate-500 mt-4">
             <p>还没有账户? <Link to="/register" className="font-medium text-primary hover:text-primary-dark">立即注册</Link></p>
           </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;