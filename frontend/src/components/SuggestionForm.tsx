
import React, { useState, useEffect, useContext } from 'react';
import { Suggestion, UserRole } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input, Textarea, Select, Modal } from './UIElements';

interface SuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (suggestion: Omit<Suggestion, 'id' | 'submittedDate' | 'status' | 'progressUpdates'>) => void;
  initialData?: Suggestion | null; 
}

const suggestionCategories = [
  { value: '公共维修', label: '公共维修' },
  { value: '环境绿化', label: '环境绿化' },
  { value: '邻里事务', label: '邻里事务' },
  { value: '安全管理', label: '安全管理' },
  { value: '其他建议', label: '其他建议' },
];

const SuggestionForm: React.FC<SuggestionFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const auth = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(suggestionCategories[0].value);
  const [submittedBy, setSubmittedBy] = useState('');

  useEffect(() => {
    if (isOpen) { // Reset or populate form when modal opens
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setSubmittedBy(initialData.submittedBy);
        } else {
            setTitle('');
            setDescription('');
            setCategory(suggestionCategories[0].value);
            if (auth?.currentUser) {
                setSubmittedBy(auth.currentUser.name);
            } else {
                setSubmittedBy('');
            }
        }
    }
  }, [initialData, isOpen, auth?.currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !submittedBy.trim()) {
      alert('请填写所有必填项！');
      return;
    }
    onSubmit({ 
        title, 
        description, 
        category, 
        submittedBy,
        submittedByUserId: auth?.currentUser?.id 
    });
    onClose(); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? '编辑建议' : '提交新建议'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="建议标题"
          id="suggestion-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：修复单元门禁"
          required
        />
        <Textarea
          label="详细描述"
          id="suggestion-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请详细描述您的问题或建议..."
          required
        />
        <Select
          label="建议类别"
          id="suggestion-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={suggestionCategories}
          required
        />
        <Input
          label="您的称呼与房号"
          id="suggestion-submittedBy"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="例如：李先生 (1栋2单元301)"
          required
          readOnly={!!auth?.currentUser} // Read-only if logged in, name is pre-filled
          className={!!auth?.currentUser ? 'bg-slate-100 cursor-not-allowed' : ''}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" variant="primary">{initialData ? '保存更改' : '提交建议'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SuggestionForm;
