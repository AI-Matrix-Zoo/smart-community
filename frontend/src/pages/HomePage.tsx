import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LightbulbIcon, ShoppingBagIcon, PencilIcon, TrashIcon, PlusCircleIcon, MegaphoneIcon } from '../components/Icons';
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
    <div className="space-y-12">
      <header className="bg-gradient-to-r from-primary to-secondary text-white p-10 rounded-xl shadow-xl text-center">
        <h1 className="text-5xl font-bold mb-4">欢迎来到智慧小区</h1>
        <p className="text-xl text-sky-100">您的便捷小区生活服务平台。</p>
      </header>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center text-primary mb-4">
            <LightbulbIcon className="w-12 h-12 mr-4" />
            <h2 className="text-3xl font-semibold">物业建议</h2>
          </div>
          <p className="text-slate-600 mb-6">
            对小区管理、设施有任何建议或问题？请在这里提出，物业将及时跟进处理，并公示进度。
          </p>
          <Link to="/suggestions">
            <Button variant="primary" size="lg" className="w-full">
              前往建议区
            </Button>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center text-secondary mb-4">
            <ShoppingBagIcon className="w-12 h-12 mr-4" />
            <h2 className="text-3xl font-semibold">闲置市场</h2>
          </div>
          <p className="text-slate-600 mb-6">
            家有闲置物品？来这里发布信息，让它们在邻里间找到新主人。也可以逛逛看有没有您需要的宝贝。
          </p>
          <Link to="/market">
            <Button variant="secondary" size="lg" className="w-full">
              进入闲置市场
            </Button>
          </Link>
        </div>
      </section>

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
