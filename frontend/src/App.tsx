import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Button } from './components/UIElements';
import { HomeIcon, LightbulbIcon, ShoppingBagIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon, CogIcon } from './components/Icons';
import { UserRole } from './types';
import UserProfileForm from './components/UserProfileForm';

// 页面组件
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SuggestionsPage from './pages/SuggestionsPage';
import MarketPage from './pages/MarketPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// 导航栏组件
const Navigation: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">智</span>
            </div>
            <span className="text-xl font-bold text-gray-800">智慧moma</span>
          </Link>

          {/* 主导航 */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              首页
            </Link>
            
                <Link
                  to="/suggestions"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/suggestions') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LightbulbIcon className="w-4 h-4 mr-2" />
                  个人物业建议
                </Link>
                
                <Link
                  to="/market"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/market') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBagIcon className="w-4 h-4 mr-2" />
                  个人闲置市场
                </Link>

            {currentUser && (
              <>
                {/* 管理员后台链接 - 只对管理员和物业人员显示 */}
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROPERTY) && (
                  <Link
                    to="/admin"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    管理后台
                  </Link>
                )}
              </>
            )}
          </div>

          {/* 用户菜单 */}
          <div className="flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{currentUser.name || currentUser.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileFormOpen(true)}
                  className="flex items-center space-x-1"
                  title="编辑个人信息"
                >
                  <CogIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>退出</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登录</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 移动端导航 */}
        {currentUser && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex justify-around">
              <Link
                to="/suggestions"
                className={`flex flex-col items-center py-2 px-3 rounded-md text-xs ${
                  isActive('/suggestions') 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-gray-600'
                }`}
              >
                <LightbulbIcon className="w-5 h-5 mb-1" />
                个人物业建议
              </Link>
              
              <Link
                to="/market"
                className={`flex flex-col items-center py-2 px-3 rounded-md text-xs ${
                  isActive('/market') 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-gray-600'
                }`}
              >
                <ShoppingBagIcon className="w-5 h-5 mb-1" />
                个人闲置市场
              </Link>

              {/* 移动端管理员后台链接 */}
              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROPERTY) && (
                <Link
                  to="/admin"
                  className={`flex flex-col items-center py-2 px-3 rounded-md text-xs ${
                    isActive('/admin') 
                      ? 'text-red-700 bg-red-50' 
                      : 'text-gray-600'
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5 mb-1" />
                  管理后台
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 用户信息编辑模态框 */}
      {currentUser && (
        <UserProfileForm
          isOpen={isProfileFormOpen}
          onClose={() => setIsProfileFormOpen(false)}
        />
      )}
    </nav>
  );
};

// 主应用组件
const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROPERTY]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2024 智慧moma生活平台. 让邻里生活更美好.</p>
            <p className="text-sm">技术支持：智慧社区解决方案</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 根应用组件
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
