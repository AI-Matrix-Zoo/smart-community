
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { RegistrationData } from '../services/dataService';
import { Button, Input, LoadingSpinner } from '../components/UIElements';
import { BuildingOfficeIcon } from '../components/Icons';

const RegisterPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // "称呼"
  const [building, setBuilding] = useState(''); // "楼栋"
  const [room, setRoom] = useState(''); // "房号"
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    if (!phone.trim() || !password.trim() || !displayName.trim() || !building.trim() || !room.trim()) {
        setError('所有字段均为必填项。');
        return;
    }
    // Basic phone validation (example: 11 digits) - can be improved
    if (!/^\d{11}$/.test(phone)) {
        setError('请输入有效的11位手机号码。');
        return;
    }

    setIsRegistering(true);

    if (!auth) {
      setError('认证服务不可用，请稍后再试。');
      setIsRegistering(false);
      return;
    }

    const registrationDetails: RegistrationData = { 
        phone, 
        password, 
        name: displayName, 
        building, 
        room 
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
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Input
            label="手机号码"
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入11位手机号"
            required
            autoComplete="tel"
          />
          <Input
            label="密码"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位字符"
            required
            minLength={6}
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
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            label="您的称呼"
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例如：张三、李女士"
            required
          />
          <Input
            label="楼栋号"
            id="building"
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="例如：1栋、A座"
            required
          />
          <Input
            label="房号"
            id="room"
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="例如：101、2003"
            required
          />

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
