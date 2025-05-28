import React, { useState, useEffect, useContext } from 'react';
import { User, UserRole } from '../../types';
import { AuthContext } from '../../contexts/AuthContext';
import { Button, Input, Select, Modal } from '../UIElements';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSave: (userId: string, userData: Partial<Pick<User, 'name' | 'phone' | 'role' | 'building' | 'room'>>) => Promise<void>;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, userToEdit, onSave }) => {
  const auth = useContext(AuthContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name.includes('(') ? userToEdit.name.substring(0, userToEdit.name.indexOf('(')).trim() : userToEdit.name);
      setPhone(userToEdit.phone);
      setRole(userToEdit.role);
      setBuilding(userToEdit.building || '');
      setRoom(userToEdit.room || '');
      setFormError(null);
    }
  }, [userToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!userToEdit) return;

    if (!name.trim() || !phone.trim()) {
      setFormError('姓名和手机号不能为空。');
      return;
    }
    // Basic phone validation (example: 11 digits for Chinese numbers, or more general)
    if (!/^\d{5,}$/.test(phone)) { // Simple validation: at least 5 digits
        setFormError('请输入有效的手机号码。');
        return;
    }
    
    let finalName = name.trim();
    if (role === UserRole.USER && building.trim() && room.trim()) {
        finalName = `${name.trim()} (${building.trim()}-${room.trim()})`;
    }


    const updatedData: Partial<Pick<User, 'name' | 'phone' | 'role' | 'building' | 'room'>> = {
      name: finalName,
      phone: phone.trim(),
      role,
    };
    if (role === UserRole.USER) {
        updatedData.building = building.trim() || undefined;
        updatedData.room = room.trim() || undefined;
    } else {
        updatedData.building = undefined;
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
        <Input
          label="手机号码"
          id="user-edit-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
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
