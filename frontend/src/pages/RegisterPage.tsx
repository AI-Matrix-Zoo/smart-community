import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { RegistrationData } from '../services/apiService';
import { Button, Input, LoadingSpinner } from '../components/UIElements';
import { BuildingOfficeIcon } from '../components/Icons';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // "称呼"
  const [building, setBuilding] = useState(''); // "楼栋"
  const [unit, setUnit] = useState(''); // "单元号"
  const [room, setRoom] = useState(''); // "房号"
  const [verificationCode, setVerificationCode] = useState(''); // "验证码"
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!email.trim()) {
      setError('请先输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: email,
          type: 'email' 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
        
        // 开发环境显示验证码
        if (result.data?.code) {
          alert(`验证码已发送: ${result.data.code}`);
        } else {
          alert('验证码已发送，请查收邮件');
        }

        // 倒计时
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCodeSent(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || '验证码发送失败');
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      setError('验证码发送失败，请检查网络连接');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    
    if (!email.trim() || !password.trim() || !displayName.trim() || 
        !building.trim() || !unit.trim() || !room.trim() || !verificationCode.trim()) {
        setError('所有字段均为必填项。');
        return;
    }
    
    // 验证邮箱格式
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址。');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('请输入6位验证码。');
        return;
    }

    setIsRegistering(true);

    if (!auth) {
      setError('认证服务不可用，请稍后再试。');
      setIsRegistering(false);
      return;
    }

    const registrationDetails: RegistrationData = { 
      email,
        password, 
        name: displayName, 
        building, 
      unit,
      room,
      verificationCode,
      verificationType: 'email'
    };
    
    const result = await auth.register(registrationDetails);
    setIsRegistering(false);

    if (result.success) {
      alert('注册成功！现在您可以登录了。');
      navigate('/login');
    } else {
      setError(result.message || '注册失败，请重试。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <BuildingOfficeIcon className="mx-auto h-16 w-auto text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            注册智慧小区账户
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            使用邮箱验证注册
          </p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* 邮箱输入和验证码发送 */}
          <div className="space-y-3">
            <Input
              label="邮箱地址"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入您的邮箱地址"
              required
              autoComplete="email"
            />
            
            <div className="flex space-x-2">
              <div className="flex-1">
          <Input
                  label="验证码"
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入6位验证码"
                  maxLength={6}
            required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode || codeSent}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {isSendingCode ? (
                    <LoadingSpinner size="sm" />
                  ) : codeSent ? (
                    `${countdown}s`
                  ) : (
                    '发送验证码'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 密码输入 */}
          <Input
            label="密码"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请设置您的密码"
            required
            autoComplete="new-password"
          />
          
          <Input
            label="确认密码"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
            required
            autoComplete="new-password"
          />

          {/* 个人信息 */}
          <Input
            label="称呼"
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="请输入您的姓名或称呼"
            required
            autoComplete="name"
          />

          {/* 住址信息 */}
          <div className="grid grid-cols-3 gap-3">
          <Input
              label="楼栋"
            id="building"
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
              placeholder="如: 1栋"
              required
            />
            <Input
              label="单元号"
              id="unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="如: 1单元"
            required
          />
          <Input
            label="房号"
            id="room"
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
              placeholder="如: 101"
            required
          />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}

          <div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRegistering}
              variant="primary"
              size="lg"
            >
              {isRegistering ? <LoadingSpinner size="sm"/> : '注 册'}
            </Button>
          </div>
          
           <div className="text-sm text-center text-slate-500 mt-4">
             <p>已有账户? <Link to="/login" className="font-medium text-primary hover:text-primary-dark">立即登录</Link></p>
           </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
