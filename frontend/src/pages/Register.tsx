import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegistrationData } from '../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    name: '',
    building: '',
    unit: '',
    room: '',
    verificationCode: '',
    verificationType: 'email'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证邮箱格式
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!formData.email) {
      setErrors({ email: '请输入邮箱地址' });
      return;
    }

    if (!isValidEmail(formData.email)) {
      setErrors({ email: '请输入有效的邮箱地址' });
      return;
    }

    setSendingCode(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.email,
          type: 'email'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        alert('验证码已发送到您的邮箱，请查收！');
      } else {
        setErrors({ email: data.message || '验证码发送失败' });
      }
    } catch (error) {
      setErrors({ email: '网络错误，请稍后重试' });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // 表单验证
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '邮箱地址不能为空';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    if (!formData.name) {
      newErrors.name = '姓名不能为空';
    }

    if (!formData.building) {
      newErrors.building = '楼栋不能为空';
    }

    if (!formData.unit) {
      newErrors.unit = '单元号不能为空';
    }

    if (!formData.room) {
      newErrors.room = '房间号不能为空';
    }

    if (!formData.verificationCode) {
      newErrors.verificationCode = '验证码不能为空';
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码必须是6位数字';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error: any) {
      setErrors({ submit: error.message || '注册失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RegistrationData) => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              立即登录
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 邮箱验证 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <div className="flex space-x-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="请输入邮箱地址"
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={sendingCode || countdown > 0}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
                </button>
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* 验证码 */}
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱验证码
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                value={formData.verificationCode}
                onChange={handleInputChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.verificationCode ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="请输入6位验证码"
                maxLength={6}
              />
              {errors.verificationCode && <p className="mt-1 text-sm text-red-600">{errors.verificationCode}</p>}
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="请输入密码（至少6位）"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="请输入真实姓名"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* 楼栋信息 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1">
                  楼栋
                </label>
                <input
                  id="building"
                  name="building"
                  type="text"
                  value={formData.building}
                  onChange={handleInputChange}
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    errors.building ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="如：1栋"
                />
                {errors.building && <p className="mt-1 text-sm text-red-600">{errors.building}</p>}
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  单元号
                </label>
                <input
                  id="unit"
                  name="unit"
                  type="text"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    errors.unit ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="如：1单元"
                />
                {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
              </div>

              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
                  房间号
                </label>
                <input
                  id="room"
                  name="room"
                  type="text"
                  value={formData.room}
                  onChange={handleInputChange}
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                    errors.room ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="如：101"
                />
                {errors.room && <p className="mt-1 text-sm text-red-600">{errors.room}</p>}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="text-red-600 text-sm text-center">{errors.submit}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 