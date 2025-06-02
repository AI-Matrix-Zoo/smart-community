import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { RegistrationData } from '../services/apiService';
import { Button, Input, LoadingSpinner } from '../components/UIElements';
import { BuildingOfficeIcon } from '../components/Icons';

const RegisterPage: React.FC = () => {
  const [identifier, setIdentifier] = useState(''); // 邮箱或手机号
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
  const [registrationType, setRegistrationType] = useState<'email' | 'sms'>('email'); // 注册方式
  
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 验证手机号格式
  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 自动检测输入类型
  const detectInputType = (input: string): 'email' | 'sms' => {
    if (validateEmail(input)) {
      return 'email';
    } else if (validatePhone(input)) {
      return 'sms';
    }
    return 'email'; // 默认邮箱
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!identifier.trim()) {
      setError('请输入邮箱或手机号');
      return;
    }

    const inputType = detectInputType(identifier);
    if (inputType === 'email' && !validateEmail(identifier)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (inputType === 'sms' && !validatePhone(identifier)) {
      setError('请输入有效的手机号');
      return;
    }

    setRegistrationType(inputType);
    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type: inputType
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
        setCountdown(60);
        
        // 开始倒计时
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 开发环境显示验证码
        if (data.data?.code) {
          console.log('验证码:', data.data.code);
        }
      } else {
        setError(data.message || '发送验证码失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!identifier.trim()) {
      setError('请输入邮箱或手机号');
      return;
    }

    const inputType = detectInputType(identifier);
    if (inputType === 'email' && !validateEmail(identifier)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (inputType === 'sms' && !validatePhone(identifier)) {
      setError('请输入有效的手机号');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!displayName.trim()) {
      setError('请输入您的称呼');
      return;
    }

    if (!building.trim() || !unit.trim() || !room.trim()) {
      setError('请完整填写楼栋、单元号和房号');
      return;
    }

    if (!verificationCode.trim()) {
      setError('请输入验证码');
      return;
    }

    if (!codeSent) {
      setError('请先获取验证码');
      return;
    }

    setIsRegistering(true);

    if (!auth) {
      setError('认证服务不可用，请稍后再试。');
      setIsRegistering(false);
      return;
    }

    const registrationData: RegistrationData = {
      identifier: identifier.trim(),
      password,
      name: displayName.trim(),
      building: building.trim(),
      unit: unit.trim(),
      room: room.trim(),
      verificationCode: verificationCode.trim(),
      verificationType: registrationType
    };

    const result = await auth.register(registrationData);
    setIsRegistering(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || '注册失败，请重试。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">注册账户</h1>
          <p className="text-slate-600 mt-2">加入智慧moma生活平台</p>
          
          {/* 手机号注册提示 */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              📧 <strong>温馨提示：</strong>手机号注册功能暂时不可用，请优先使用邮箱注册
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="邮箱或手机号"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="请输入邮箱或手机号"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              支持邮箱注册或手机号注册
            </p>
          </div>

          <div>
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位密码"
              required
            />
          </div>

          <div>
            <Input
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
            />
          </div>

          <div>
            <Input
              label="您的称呼"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="如：张三"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="楼栋"
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="如：1栋"
              required
            />
            <Input
              label="单元号"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="如：1单元"
              required
            />
            <Input
              label="房号"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="如：101"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="验证码"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6位验证码"
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0 || !identifier.trim()}
                className="whitespace-nowrap"
              >
                {isSendingCode ? (
                  <LoadingSpinner size="sm" />
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  '获取验证码'
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isRegistering}
          >
            {isRegistering ? <LoadingSpinner size="sm" /> : '注册'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600">
            已有账户？{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
