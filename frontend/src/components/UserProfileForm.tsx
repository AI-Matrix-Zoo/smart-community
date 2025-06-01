import React, { useState, useEffect } from 'react';
import { updateUserProfile } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Modal } from './UIElements';

interface UserProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      // 从用户名中提取基本姓名（去掉地址部分）
      const baseName = currentUser.name.includes('(') 
        ? currentUser.name.substring(0, currentUser.name.indexOf('(')).trim()
        : currentUser.name;
      
      setName(baseName);
      setBuilding(currentUser.building || '');
      setUnit(currentUser.unit || '');
      setRoom(currentUser.room || '');
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [currentUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name.trim()) {
      setError('姓名不能为空');
      setIsSubmitting(false);
      return;
    }

    if (password && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsSubmitting(false);
      return;
    }

    if (password && password.length < 6) {
      setError('密码至少需要6位');
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData: any = {
        name: name.trim(),
        building: building.trim() || undefined,
        unit: unit.trim() || undefined,
        room: room.trim() || undefined,
      };

      if (password) {
        updateData.password = password;
      }

      const updatedUser = await updateUserProfile(updateData);
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑个人信息">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入您的姓名"
          required
        />
        
        <Input
          label="楼栋"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="如：1栋"
        />
        
        <Input
          label="单元"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="如：1单元"
        />
        
        <Input
          label="房间号"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="如：101"
        />
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-700 mb-3">修改密码（可选）</h4>
          
          <Input
            label="新密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="留空则不修改密码"
          />
          
          {password && (
            <Input
              label="确认新密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
            />
          )}
        </div>

        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserProfileForm; 