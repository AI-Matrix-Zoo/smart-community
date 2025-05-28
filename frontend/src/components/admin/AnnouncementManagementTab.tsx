import React, { useState, useEffect, useCallback } from 'react';
import { Announcement } from '../../types';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/dataService';
import { Button, LoadingSpinner } from '../UIElements';
import { PlusCircleIcon, PencilIcon, TrashIcon, MegaphoneIcon } from '../Icons';
import AnnouncementForm from '../AnnouncementForm';

const AnnouncementManagementTab: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError('获取公告失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleAddClick = () => {
    setEditingAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('您确定要删除这条公告吗？此操作不可撤销。')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
      } catch (err) {
        alert('删除公告失败，请重试。');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (content: string) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, content);
      } else {
        await addAnnouncement(content);
      }
      fetchAnnouncements();
      setIsFormOpen(false);
      setEditingAnnouncement(null);
    } catch (err) {
      alert(editingAnnouncement ? '更新公告失败，请重试。' : '发布公告失败，请重试。');
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <MegaphoneIcon className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-semibold text-slate-700">平台公告管理</h2>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleAddClick}
          leftIcon={<PlusCircleIcon className="w-5 h-5" />}
        >
          发布新公告
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-100 p-4 rounded-md text-center">
          {error}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">暂无平台公告</p>
          <p className="text-gray-400 text-sm mt-2">点击上方按钮发布第一条公告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap text-base leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                    <span>发布人: {announcement.authorName}</span>
                    <span>角色: {announcement.roleOfAuthor}</span>
                    <span>发布时间: {new Date(announcement.createdAt).toLocaleString()}</span>
                    {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                      <span className="italic">
                        (编辑于 {new Date(announcement.updatedAt).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(announcement)}
                    className="text-blue-600 hover:bg-blue-50"
                    aria-label="编辑公告"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-600 hover:bg-red-50"
                    aria-label="删除公告"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 公告表单模态框 */}
      {isFormOpen && (
        <AnnouncementForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingAnnouncement}
        />
      )}
    </div>
  );
};

export default AnnouncementManagementTab; 