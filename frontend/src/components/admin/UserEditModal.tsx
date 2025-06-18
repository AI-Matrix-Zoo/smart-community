import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Button, Input, Modal, Select } from '../UIElements';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSave: (userId: string, userData: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role' | 'building' | 'unit' | 'room'>>) => Promise<void>;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, userToEdit, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [room, setRoom] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setRole(userToEdit.role);
      setBuilding(userToEdit.building || '');
      setUnit(userToEdit.unit || '');
      setRoom(userToEdit.room || '');
      setFormError(null);
    }
  }, [userToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!userToEdit) return;

    if (!name.trim()) {
      setFormError('姓名不能为空。');
      return;
    }
    
    // 验证邮箱格式（如果填写了）
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('请输入有效的邮箱地址。');
      return;
    }

    // 验证手机号格式（如果填写了）
    if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      setFormError('请输入有效的手机号。');
      return;
    }
    
    let finalName = name.trim();

    const updatedData: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role' | 'building' | 'unit' | 'room'>> = {
      name: finalName,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
    };
    if (role === UserRole.USER) {
        updatedData.building = building.trim() || undefined;
        updatedData.unit = unit.trim() || undefined;
        updatedData.room = room.trim() || undefined;
    } else {
        updatedData.building = undefined;
        updatedData.unit = undefined;
        updatedData.room = undefined;
    }
    
    await onSave(userToEdit.id, updatedData);
    // onClose(); // Let parent handle closing on successful save
  };

  if (!userToEdit) return null;

  const roleOptions = Object.values(UserRole).map(r => ({ value: r, label: r }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`编辑用户: ${userToEdit.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="姓名/称呼"
          id="user-edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="邮箱地址（可选）"
            id="user-edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="如：user@example.com"
          />
          <Input
            label="手机号（可选）"
            id="user-edit-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="如：13800138000"
          />
        </div>
        <Select
          label="用户角色"
          id="user-edit-role"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          required
        />
        {role === UserRole.USER && (
          <>
            <Input
              label="楼栋号 (业主)"
              id="user-edit-building"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="例如：1栋"
            />
            <Input
              label="单元号 (业主)"
              id="user-edit-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="例如：1单元"
            />
            <Input
              label="房号 (业主)"
              id="user-edit-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="例如：101"
            />
          </>
        )}
        {formError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{formError}</p>}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" variant="primary">保存更改</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;
