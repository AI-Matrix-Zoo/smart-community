import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LightbulbIcon, ShoppingBagIcon, MegaphoneIcon, HomeIcon, UsersIcon, ShieldCheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from './Icons';
import { Button, LoadingSpinner } from './UIElements';
import { Announcement } from '../types';
import { getMobileAnnouncements, runMobileDiagnostic, clearMobileCache } from '../services/mobileApiService';
import { AuthContext } from '../contexts/AuthContext';

interface MobileHomePageProps {
  className?: string;
}

const MobileHomePage: React.FC<MobileHomePageProps> = ({ className = '' }) => {
  const auth = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // 检查网络状态
  const checkNetworkStatus = useCallback(() => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  }, []);

  // 获取公告数据
  const fetchAnnouncementsData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingAnnouncements(true);
    }
    setAnnouncementError(null);
    
    try {
      console.log('🔄 开始获取公告数据...');
      const data = await getMobileAnnouncements();
      console.log('✅ 公告数据获取成功:', data);
      
      setAnnouncements(data);
      setLastUpdateTime(new Date());
      setRetryCount(0);
      setNetworkStatus('online');
      
    } catch (err) {
      console.error('❌ 获取公告失败:', err);
      const errorMessage = err instanceof Error ? err.message : '获取公告失败，请稍后重试。';
      setAnnouncementError(errorMessage);
      
      // 增加重试计数
      setRetryCount(prev => prev + 1);
      
      // 检查是否是网络问题
      if (errorMessage.includes('网络') || errorMessage.includes('连接')) {
        setNetworkStatus('offline');
      }
      
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  // 手动刷新
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 手动刷新数据...');
    await fetchAnnouncementsData(true);
  }, [fetchAnnouncementsData]);

  // 运行诊断
  const handleRunDiagnostic = useCallback(async () => {
    setShowDiagnostic(true);
    try {
      console.log('🔧 开始运行网络诊断...');
      const result = await runMobileDiagnostic();
      console.log('📊 诊断结果:', result);
      
      if (result.errors.length > 0) {
        setAnnouncementError(`诊断发现问题: ${result.errors.join(', ')}`);
      } else {
        setAnnouncementError(null);
        // 诊断成功后重新获取数据
        await fetchAnnouncementsData(true);
      }
    } catch (error) {
      console.error('❌ 诊断失败:', error);
      setAnnouncementError('网络诊断失败，请检查网络连接');
    } finally {
      setShowDiagnostic(false);
    }
  }, [fetchAnnouncementsData]);

  // 清理缓存
  const handleClearCache = useCallback(() => {
    clearMobileCache();
    setAnnouncements([]);
    setLastUpdateTime(null);
    setRetryCount(0);
    fetchAnnouncementsData(true);
  }, [fetchAnnouncementsData]);

  // 初始化和网络状态监听
  useEffect(() => {
    checkNetworkStatus();
    fetchAnnouncementsData();

    // 监听网络状态变化
    const handleOnline = () => {
      console.log('🌐 网络已连接');
      setNetworkStatus('online');
      fetchAnnouncementsData(false); // 网络恢复时静默刷新
    };

    const handleOffline = () => {
      console.log('📵 网络已断开');
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchAnnouncementsData, checkNetworkStatus]);

  // 自动重试机制
  useEffect(() => {
    if (announcementError && retryCount < 3 && networkStatus === 'online') {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // 指数退避，最大10秒
      console.log(`⏰ ${retryDelay}ms后自动重试 (第${retryCount + 1}次)`);
      
      const timer = setTimeout(() => {
        fetchAnnouncementsData(false);
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [announcementError, retryCount, networkStatus, fetchAnnouncementsData]);

  return (
    <div className={`space-y-6 sm:space-y-8 ${className}`}>
      {/* 网络状态指示器 */}
      {networkStatus === 'offline' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">网络连接异常</p>
              <p className="text-xs text-red-600 mt-1">正在显示缓存数据，请检查网络连接</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDiagnostic}
              disabled={showDiagnostic}
              className="ml-2"
            >
              {showDiagnostic ? <LoadingSpinner size="sm" /> : '诊断'}
            </Button>
          </div>
        </div>
      )}

      {/* 主横幅区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative text-center py-12 sm:py-16 px-6 sm:px-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-full">
              <HomeIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
            智慧moma生活平台
          </h1>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            连接邻里，共建美好社区生活。让科技为社区服务，让生活更加便捷温馨。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/suggestions">
              <Button 
                variant="primary" 
                size="lg" 
                leftIcon={<LightbulbIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="w-full sm:w-auto !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white hover:!from-blue-600 hover:!to-blue-700 active:!from-blue-700 active:!to-blue-800 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 border-0 shadow-lg transition-all duration-200"
              >
                提交建议反馈
              </Button>
            </Link>
            <Link to="/market">
              <Button 
                variant="secondary" 
                size="lg" 
                leftIcon={<ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="w-full sm:w-auto !bg-gradient-to-r !from-green-500 !to-green-600 !text-white hover:!from-green-600 hover:!to-green-700 active:!from-green-700 active:!to-green-800 focus:ring-2 focus:ring-green-300 focus:ring-opacity-50 !border-0 !border-none shadow-lg transition-all duration-200"
              >
                浏览闲置市场
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 核心功能卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="group bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg sm:rounded-xl mb-4 sm:mb-6 group-hover:bg-blue-200 transition-colors">
            <LightbulbIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-2xl font-medium sm:font-bold text-slate-800 mb-3 sm:mb-4">建议反馈</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
            对社区管理、设施维护有任何建议？在这里提出，物业将及时跟进处理，让您的声音被听见。
          </p>
          <Link to="/suggestions">
            <Button variant="outline" size="md" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
              立即反馈 →
            </Button>
          </Link>
        </div>

        <div className="group bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-lg sm:rounded-xl mb-4 sm:mb-6 group-hover:bg-green-200 transition-colors">
            <ShoppingBagIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h3 className="text-lg sm:text-2xl font-medium sm:font-bold text-slate-800 mb-3 sm:mb-4">闲置市场</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
            发布和浏览社区内的闲置物品，让资源得到更好的利用，促进邻里交流，共建绿色社区。
          </p>
          <Link to="/market">
            <Button variant="outline" size="md" className="w-full group-hover:bg-green-50 group-hover:border-green-300">
              立即浏览 →
            </Button>
          </Link>
        </div>

        <div className="group bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-lg sm:rounded-xl mb-4 sm:mb-6 group-hover:bg-purple-200 transition-colors">
            <MegaphoneIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
          <h3 className="text-lg sm:text-2xl font-medium sm:font-bold text-slate-800 mb-3 sm:mb-4">社区公告</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
            及时了解社区最新动态、活动通知和重要公告信息，不错过任何重要消息。
          </p>
          
          {/* 公告内容区域 */}
          <div className="space-y-3">
            {isLoadingAnnouncements ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-slate-500">加载中...</span>
              </div>
            ) : announcementError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-800 font-medium">加载失败</p>
                    <p className="text-xs text-red-600 mt-1 break-words">{announcementError}</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-red-500 mt-1">已重试 {retryCount} 次</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualRefresh}
                    disabled={isLoadingAnnouncements}
                    className="text-xs"
                  >
                    {isLoadingAnnouncements ? <LoadingSpinner size="sm" /> : <ArrowPathIcon className="w-3 h-3" />}
                    重试
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearCache}
                    className="text-xs"
                  >
                    清理缓存
                  </Button>
                </div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-2">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-slate-700 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {announcements.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">
                    还有 {announcements.length - 3} 条公告...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">暂无公告</p>
              </div>
            )}
            
            {/* 更新时间 */}
            {lastUpdateTime && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>最后更新: {lastUpdateTime.toLocaleTimeString()}</span>
                <div className={`w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 社区价值观 */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 sm:p-10 rounded-xl sm:rounded-2xl">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
            智慧moma社区理念
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
            我们致力于打造一个温馨、便民、智能的现代化社区生活环境
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full mx-auto mb-4 sm:mb-6">
              <UsersIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">邻里和谐</h3>
            <p className="text-sm sm:text-base text-slate-600">
              促进邻里交流，建立互助友爱的社区氛围，让每个人都能感受到家的温暖。
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mx-auto mb-4 sm:mb-6">
              <LightbulbIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">智能便民</h3>
            <p className="text-sm sm:text-base text-slate-600">
              运用现代科技提升社区服务效率，让居民享受更便捷、更智能的生活体验。
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full mx-auto mb-4 sm:mb-6">
              <ShieldCheckIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">安全保障</h3>
            <p className="text-sm sm:text-base text-slate-600">
              完善的安全管理体系，24小时守护社区安全，让居民安心生活。
            </p>
          </div>
        </div>
      </div>

      {/* 调试信息 (开发环境) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-4 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">调试信息</summary>
            <div className="space-y-1 text-gray-600">
              <p>网络状态: {networkStatus}</p>
              <p>重试次数: {retryCount}</p>
              <p>公告数量: {announcements.length}</p>
              <p>最后更新: {lastUpdateTime?.toLocaleString() || '未更新'}</p>
              <p>用户代理: {navigator.userAgent.substring(0, 50)}...</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default MobileHomePage; 