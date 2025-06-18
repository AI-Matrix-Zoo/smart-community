import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input, LoadingSpinner } from '../components/UIElements';
import { BuildingOfficeIcon, PhotoIcon } from '../components/Icons';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState(''); // 姓名
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [building, setBuilding] = useState(''); // 楼栋
  const [unit, setUnit] = useState(''); // 单元号
  const [room, setRoom] = useState(''); // 房号
  const [identityImage, setIdentityImage] = useState<File | null>(null); // 身份验证图片
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
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

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过5MB');
      return;
    }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持 JPEG、PNG 和 PDF 格式的文件');
      return;
    }

      setIdentityImage(file);
    setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    // 验证邮箱格式（如果填写了）
    if (email.trim() && !validateEmail(email.trim())) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 验证手机号格式（如果填写了）
    if (phone.trim() && !validatePhone(phone.trim())) {
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

    if (!building.trim() || !unit.trim() || !room.trim()) {
      setError('请完整填写楼栋、单元号和房号');
      return;
    }

    setIsRegistering(true);

    if (!auth) {
      setError('认证服务不可用，请稍后再试。');
      setIsRegistering(false);
      return;
    }

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('password', password);
      formData.append('building', building.trim());
      formData.append('unit', unit.trim());
      formData.append('room', room.trim());
      
      // 添加可选的邮箱和手机号
      if (email.trim()) {
        formData.append('email', email.trim());
      }
      if (phone.trim()) {
        formData.append('phone', phone.trim());
      }
      
      if (identityImage) {
        formData.append('identityImage', identityImage);
      }

      const response = await fetch(`${import.meta.env.DEV ? 'http://localhost:3000' : ''}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // 保存token和用户信息
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // 更新认证状态 - 直接设置用户信息
        if (auth.updateUser) {
          auth.updateUser(data.data.user);
        }
        
      navigate('/');
    } else {
        setError(data.message || '注册失败，请重试。');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">注册账户</h1>
          <p className="text-slate-600 mt-2">加入智慧小区生活平台</p>
        </div>
          
        {/* 重要提醒 */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-amber-500 text-lg mr-2">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">重要提醒</h3>
              <p className="text-xs text-amber-700">
                您的姓名和住址信息（楼栋、单元号、房号）一旦注册确认后将无法修改，请务必仔细核对后再提交。如需修改请联系管理员。
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 姓名 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              您的姓名
            </label>
            <Input
              id="name"
              type="text"
              placeholder="如：张三"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 联系方式 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                邮箱（可选）
              </label>
              <Input
                id="email"
                type="email"
                placeholder="如：zhang@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                手机号（可选）
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="如：13800138000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="至少6位密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* 住址信息 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="building" className="block text-sm font-medium text-slate-700 mb-2">
                楼栋
              </label>
            <Input
                id="building"
              type="text"
                placeholder="如：1栋"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              required
            />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-2">
                单元号
              </label>
            <Input
                id="unit"
              type="text"
                placeholder="如：1单元"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
          </div>
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-slate-700 mb-2">
                房号
              </label>
              <Input
                id="room"
                type="text"
                placeholder="如：101"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 身份验证图片 */}
          <div>
            <label htmlFor="identityImage" className="block text-sm font-medium text-slate-700 mb-2">
              身份验证图片（可选）
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="identityImage"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>上传文件</span>
                    <input
                      id="identityImage"
                      name="identityImage"
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">或拖拽到此处</p>
                </div>
                <p className="text-xs text-gray-500">
                  支持 JPEG、PNG、PDF 格式，最大 5MB
                </p>
                <p className="text-xs text-gray-500">
                  可上传合同封面、房产证等身份证明材料
                </p>
                {identityImage && (
                  <p className="text-sm text-green-600 mt-2">
                    已选择：{identityImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isRegistering}
            className="w-full"
          >
            {isRegistering ? (
              <>
                <LoadingSpinner size="sm" />
                注册中...
              </>
            ) : (
              '注册'
            )}
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
