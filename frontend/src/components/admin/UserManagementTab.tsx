import React, { useState, useEffect, useCallback, useContext } from 'react';
import { adminGetAllUsers, adminUpdateUser, adminDeleteUser, adminVerifyUser, adminUnverifyUser, adminResetUserPassword } from '../../services/apiService';
import { User, UserRole } from '../../types';
import { Button, LoadingSpinner, Badge, Modal, Input } from '../UIElements';
import { PencilIcon, TrashIcon, UsersIcon, EyeIcon, CheckBadgeIcon, PhotoIcon, CogIcon } from '../Icons';
import { AuthContext } from '../../contexts/AuthContext';
import UserEditModal from './UserEditModal';
import IdentityImageModal from './IdentityImageModal';

const UserManagementTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [userToViewImage, setUserToViewImage] = useState<User | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
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

  const handleViewImage = (user: User) => {
    setUserToViewImage(user);
    setIsImageModalOpen(true);
  };

  const handleVerifyUser = async (userId: string, userName: string) => {
    if (window.confirm(`确定要认证用户 "${userName}" 吗？`)) {
      try {
        const success = await adminVerifyUser(userId);
        if (success) {
          fetchUsers(); // 刷新列表
        } else {
          alert('认证用户失败。');
        }
      } catch (err) {
        alert('认证用户时出错。');
        console.error(err);
      }
    }
  };

  const handleUnverifyUser = async (userId: string, userName: string) => {
    if (window.confirm(`确定要取消认证用户 "${userName}" 吗？`)) {
      try {
        const success = await adminUnverifyUser(userId);
        if (success) {
          fetchUsers(); // 刷新列表
        } else {
          alert('取消认证失败。');
        }
      } catch (err) {
        alert('取消认证时出错。');
        console.error(err);
      }
    }
  };

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordResetSubmit = async () => {
    if (!userToResetPassword || !newPassword.trim()) {
      alert('请输入新密码。');
      return;
    }

    if (newPassword.length < 6) {
      alert('密码至少需要6位字符。');
      return;
    }

    try {
      const success = await adminResetUserPassword(userToResetPassword.id, newPassword);
      if (success) {
        alert(`用户 "${userToResetPassword.name}" 的密码已成功重置。`);
        setIsPasswordModalOpen(false);
        setUserToResetPassword(null);
        setNewPassword('');
      } else {
        alert('重置密码失败。');
      }
    } catch (err) {
      alert('重置密码时出错。');
      console.error(err);
    }
  };

  const handleSaveUser = async (userId: string, userData: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role' | 'building' | 'unit' | 'room'>>) => {
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
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">联系方式</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">楼栋</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">单元</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">房号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">证明材料</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">认证状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="space-y-1">
                    <div>
                      <span className="text-xs text-gray-400">邮箱: </span>
                      <span>{user.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">手机: </span>
                      <span>{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge color={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.building || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.unit || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.room || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.identity_image ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewImage(user)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <PhotoIcon className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  ) : (
                    <span className="text-gray-400">未上传</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.is_verified ? (
                    <div className="flex items-center space-x-1">
                      <CheckBadgeIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-xs">已认证</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">未认证</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} aria-label="编辑用户">
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                  </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleResetPassword(user)}
                      aria-label="重置密码"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <CogIcon className="w-4 h-4" />
                    </Button>
                    
                    {user.role === UserRole.USER && (
                      user.is_verified ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleUnverifyUser(user.id, user.name)}
                          aria-label="取消认证"
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <CheckBadgeIcon className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVerifyUser(user.id, user.name)}
                          aria-label="认证用户"
                          className="text-green-600 hover:text-green-800"
                        >
                          <CheckBadgeIcon className="w-4 h-4" />
                        </Button>
                      )
                    )}
                    
                  {auth?.currentUser?.id !== user.id && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id, user.name)} aria-label="删除用户">
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                  </div>
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

      {isImageModalOpen && userToViewImage && (
        <IdentityImageModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setUserToViewImage(null);
          }}
          user={userToViewImage}
        />
      )}

      {isPasswordModalOpen && userToResetPassword && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setUserToResetPassword(null);
            setNewPassword('');
          }}
          title={`重置用户密码 - ${userToResetPassword.name}`}
        >
          <div className="space-y-4">
            <Input
              label="新密码"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6位字符）"
              required
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setUserToResetPassword(null);
                  setNewPassword('');
                }}
              >
                取消
              </Button>
              <Button variant="primary" onClick={handlePasswordResetSubmit}>
                重置密码
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementTab;
