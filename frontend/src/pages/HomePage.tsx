import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LightbulbIcon, ShoppingBagIcon, PencilIcon, TrashIcon, PlusCircleIcon, MegaphoneIcon, HomeIcon, UsersIcon, ShieldCheckIcon } from '../components/Icons';
import { Button, LoadingSpinner } from '../components/UIElements';
import { Announcement, UserRole } from '../types';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/apiService';
import { AuthContext } from '../contexts/AuthContext';
import AnnouncementForm from '../components/AnnouncementForm';

const HomePage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const canManageAnnouncements = auth?.currentUser &&
    (auth.currentUser.role === UserRole.ADMIN || auth.currentUser.role === UserRole.PROPERTY);

  const fetchAnnouncementsData = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setAnnouncementError('获取公告失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncementsData();
  }, [fetchAnnouncementsData]);

  const handleAddAnnouncementClick = () => {
    setEditingAnnouncement(null);
    setIsAnnouncementFormOpen(true);
  };

  const handleEditAnnouncementClick = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsAnnouncementFormOpen(true);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('您确定要删除这条公告吗？此操作不可撤销。')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncementsData(); 
      } catch (err) {
        alert('删除公告失败，请重试。');
        console.error(err);
      }
    }
  };

  const handleAnnouncementFormSubmit = async (content: string) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, content);
      } else {
        await addAnnouncement(content);
      }
      fetchAnnouncementsData(); 
      setIsAnnouncementFormOpen(false);
      setEditingAnnouncement(null);
    } catch (err) {
      alert(editingAnnouncement ? '更新公告失败，请重试。' : '发布公告失败，请重试。');
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* 主横幅区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative text-center py-16 px-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <HomeIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            智慧moma生活平台
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            连接邻里，共建美好社区生活。让科技为社区服务，让生活更加便捷温馨。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/suggestions">
              <Button 
                variant="primary" 
                size="lg" 
                leftIcon={<LightbulbIcon className="w-5 h-5" />}
                className="!bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white hover:!from-blue-600 hover:!to-blue-700 active:!from-blue-700 active:!to-blue-800 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 border-0 shadow-lg transition-all duration-200"
              >
                提交建议反馈
              </Button>
            </Link>
            <Link to="/market">
              <Button 
                variant="secondary" 
                size="lg" 
                leftIcon={<ShoppingBagIcon className="w-5 h-5" />}
                className="!bg-gradient-to-r !from-green-500 !to-green-600 !text-white hover:!from-green-600 hover:!to-green-700 active:!from-green-700 active:!to-green-800 focus:ring-2 focus:ring-green-300 focus:ring-opacity-50 !border-0 !border-none shadow-lg transition-all duration-200"
              >
                浏览闲置市场
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 核心功能卡片 */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6 group-hover:bg-blue-200 transition-colors">
            <LightbulbIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">建议反馈</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            对社区管理、设施维护有任何建议？在这里提出，物业将及时跟进处理，让您的声音被听见。
          </p>
          <Link to="/suggestions">
            <Button variant="outline" size="md" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
              立即反馈 →
            </Button>
          </Link>
        </div>

        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6 group-hover:bg-green-200 transition-colors">
            <ShoppingBagIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">闲置市场</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            发布和浏览社区内的闲置物品，让资源得到更好的利用，促进邻里交流，共建绿色社区。
          </p>
          <Link to="/market">
            <Button variant="outline" size="md" className="w-full group-hover:bg-green-50 group-hover:border-green-300">
              立即浏览 →
            </Button>
          </Link>
        </div>

        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-6 group-hover:bg-purple-200 transition-colors">
            <MegaphoneIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">社区公告</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            及时了解社区最新动态、活动通知和重要公告信息，不错过任何重要消息。
          </p>
          <Button variant="outline" size="md" className="w-full" disabled>
            敬请期待
          </Button>
        </div>
      </div>

      {/* 社区价值观 */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-10 rounded-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            智慧moma社区理念
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            我们致力于打造一个温馨、便民、智能的现代化社区生活环境
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6">
              <UsersIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">邻里和谐</h3>
            <p className="text-slate-600">
              促进邻里交流，建立互助友爱的社区氛围，让每个人都能感受到家的温暖。
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6">
              <LightbulbIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">智能便民</h3>
            <p className="text-slate-600">
              运用现代科技提升社区服务效率，让居民享受更便捷、更智能的生活体验。
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
              <ShieldCheckIcon className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">贴心服务</h3>
            <p className="text-slate-600">
              以居民需求为中心，提供个性化、人性化的社区服务，让生活更加美好。
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <MegaphoneIcon className="w-10 h-10 text-accent mr-3" />
            <h2 className="text-3xl font-semibold text-slate-800">平台公告</h2>
          </div>
          {canManageAnnouncements && (
            <Button
              variant="primary"
              size="md"
              onClick={handleAddAnnouncementClick}
              leftIcon={<PlusCircleIcon className="w-5 h-5" />}
            >
              发布新公告
            </Button>
          )}
        </div>

        {isLoadingAnnouncements ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : announcementError ? (
          <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{announcementError}</p>
        ) : announcements.length === 0 ? (
          <p className="text-slate-500 italic text-center py-8">暂无平台公告。</p>
        ) : (
          <ul className="space-y-5">
            {announcements.map((ann) => (
              <li key={ann.id} className="p-5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-slate-700 mb-3 whitespace-pre-wrap text-base leading-relaxed">{ann.content}</p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500">
                  <div className="mb-2 sm:mb-0">
                    <span>发布人: {ann.authorName} ({ann.roleOfAuthor})</span>
                    <span className="mx-1 sm:mx-2">|</span>
                    <span>发布于: {new Date(ann.createdAt).toLocaleDateString()}</span>
                    {ann.updatedAt && ann.updatedAt !== ann.createdAt && (
                      <span className="italic ml-1 sm:ml-2">(编辑于 {new Date(ann.updatedAt).toLocaleDateString()})</span>
                    )}
                  </div>
                  {canManageAnnouncements && (
                    <div className="space-x-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="text-xs p-1.5 hover:bg-slate-200" onClick={() => handleEditAnnouncementClick(ann)} aria-label="编辑公告">
                        <PencilIcon className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs p-1.5 hover:bg-slate-200" onClick={() => handleDeleteAnnouncement(ann.id)} aria-label="删除公告">
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAnnouncementFormOpen && canManageAnnouncements && (
        <AnnouncementForm
          isOpen={isAnnouncementFormOpen}
          onClose={() => {
            setIsAnnouncementFormOpen(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleAnnouncementFormSubmit}
          initialData={editingAnnouncement}
        />
      )}
    </div>
  );
};

export default HomePage;
