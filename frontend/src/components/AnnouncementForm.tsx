
import React, { useState, useEffect, useContext } from 'react';
import { Announcement } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Textarea, Modal } from './UIElements';

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  initialData?: Announcement | null; 
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const auth = useContext(AuthContext);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) { 
        if (initialData) {
            setContent(initialData.content);
        } else {
            setContent('');
        }
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('请填写公告内容！');
      return;
    }
    onSubmit(content);
  };

  if (!auth?.currentUser || (auth.currentUser.role !== 'ADMIN' && auth.currentUser.role !== 'PROPERTY')) {
    // This check is mostly a safeguard; the button to open this form should already be role-protected.
    if (isOpen) onClose(); // Close if somehow opened without perms
    return null; 
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? '编辑公告' : '发布新公告'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Textarea
          label="公告内容"
          id="announcement-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入公告的详细内容..."
          required
          rows={6}
        />
        <div className="text-sm text-slate-500">
          发布人: {auth.currentUser.name} ({auth.currentUser.role})
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" variant="primary">{initialData ? '保存更改' : '确认发布'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AnnouncementForm;
