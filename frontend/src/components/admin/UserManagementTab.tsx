import React, { useState, useEffect, useCallback, useContext } from 'react';
import { User, UserRole } from '../../types';
import { adminGetAllUsers, adminUpdateUser, adminDeleteUser } from '../../services/dataService';
import { AuthContext } from '../../contexts/AuthContext';
import { Button, LoadingSpinner, Badge } from '../UIElements';
import { PencilIcon, TrashIcon, UsersIcon } from '../Icons';
import UserEditModal from './UserEditModal';

const UserManagementTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const auth = useContext(AuthContext);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch (err) {
      setError('获取用户列表失败。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userId: string, userData: Partial<Pick<User, 'name' | 'phone' | 'role' | 'building' | 'room'>>) => {
    try {
      const updatedUser = await adminUpdateUser(userId, userData);
      if (updatedUser) {
        fetchUsers(); // Refresh list
        // If the edited user is the current admin, update context (though dataService already handles CURRENT_USER_KEY)
        if (auth?.currentUser?.id === userId) {
            // AuthContext doesn't have a direct updateUser method, but dataService updated localStorage.
            // A full page reload or re-login would reflect changes. For SPA, ideally AuthContext handles this.
            // For now, rely on dataService keeping localStorage current.
        }
        setIsEditModalOpen(false);
        setUserToEdit(null);
      } else {
        alert('更新用户失败。用户可能不存在或您没有权限更改最后一个管理员的角色。');
      }
    } catch (err) {
      alert('更新用户时出错。');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === auth?.currentUser?.id) {
      alert('管理员不能删除自己。');
      return;
    }
    if (window.confirm(`确定要删除用户 "${userName}" 吗？此操作不可撤销。`)) {
      try {
        const success = await adminDeleteUser(userId);
        if (success) {
          fetchUsers(); // Refresh list
        } else {
          alert('删除用户失败。');
        }
      } catch (err) {
        alert('删除用户时出错。');
        console.error(err);
      }
    }
  };
  
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'red';
      case UserRole.PROPERTY: return 'amber';
      case UserRole.USER: return 'sky';
      default: return 'slate';
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-2xl font-semibold text-slate-700">
        <UsersIcon className="w-8 h-8" />
        <span>用户管理</span>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">手机号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">楼栋/房号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge color={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.building && user.room ? `${user.building}-${user.room}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} aria-label="编辑用户">
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                  </Button>
                  {auth?.currentUser?.id !== user.id && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id, user.name)} aria-label="删除用户">
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-slate-500 text-center py-5">没有找到用户。</p>}

      {isEditModalOpen && userToEdit && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setUserToEdit(null);
          }}
          userToEdit={userToEdit}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default UserManagementTab;
