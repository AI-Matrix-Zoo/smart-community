import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Suggestion, SuggestionStatus, UserRole } from '../types';
import { getSuggestions, addSuggestion, updateSuggestionStatus, addSuggestionProgress } from '../services/dataService';
import { Button, LoadingSpinner, Badge, Modal, Textarea, Select } from '../components/UIElements';
import { PlusCircleIcon, ChevronDownIcon, ChatBubbleLeftEllipsisIcon, LightbulbIcon } from '../components/Icons';
import SuggestionForm from '../components/SuggestionForm';
import { AuthContext } from '../contexts/AuthContext';

const SuggestionItem: React.FC<{ 
    suggestion: Suggestion; 
    onStatusChange: (id: string, status: SuggestionStatus, updateText: string) => void; 
    onAddProgress: (id: string, updateText: string) => void; 
}> = ({ suggestion, onStatusChange, onAddProgress }) => {
  const auth = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newStatus, setNewStatus] = useState<SuggestionStatus>(suggestion.status);
  const [statusUpdateText, setStatusUpdateText] = useState('');
  const [progressText, setProgressText] = useState('');

  const canManage = auth?.currentUser && (auth.currentUser.role === UserRole.PROPERTY || auth.currentUser.role === UserRole.ADMIN);

  const getStatusColor = (status: SuggestionStatus) => {
    switch (status) {
      case SuggestionStatus.Submitted: return 'sky';
      case SuggestionStatus.InProgress: return 'amber';
      case SuggestionStatus.Resolved: return 'emerald';
      case SuggestionStatus.Rejected: return 'red';
      default: return 'slate';
    }
  };

  const handleStatusUpdateSubmit = () => {
    if (!statusUpdateText.trim()) {
      alert("请输入状态更新说明。");
      return;
    }
    onStatusChange(suggestion.id, newStatus, statusUpdateText);
    setShowStatusModal(false);
    setStatusUpdateText('');
  };
  
  const handleProgressSubmit = () => {
    if (!progressText.trim()) {
      alert("请输入进展内容。");
      return;
    }
    onAddProgress(suggestion.id, progressText);
    setShowProgressModal(false);
    setProgressText('');
  };


  return (
    <div className="bg-white shadow-lg rounded-xl p-6 transition-shadow duration-300 hover:shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 mb-1">{suggestion.title}</h3>
          <p className="text-sm text-slate-500">由 {suggestion.submittedBy} 于 {new Date(suggestion.submittedDate).toLocaleDateString()} 提交</p>
          <p className="text-sm text-slate-500">类别: {suggestion.category}</p>
        </div>
        <Badge color={getStatusColor(suggestion.status)}>{suggestion.status}</Badge>
      </div>
      <p className="text-slate-700 mt-3 mb-4 whitespace-pre-wrap">{suggestion.description}</p>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        {canManage ? (
          <div className="space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setShowStatusModal(true)} className="text-xs">更新状态</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowProgressModal(true)} className="text-xs" leftIcon={<ChatBubbleLeftEllipsisIcon className="w-4 h-4"/>}>添加进展</Button>
          </div>
        ) : <div />} 
        <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)} 
            rightIcon={<ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
            className="text-xs"
        >
            {expanded ? '收起进展' : '查看进展'} ({suggestion.progressUpdates.length})
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {suggestion.progressUpdates.length > 0 ? (
            suggestion.progressUpdates.map((update, index) => (
              <div key={index} className="bg-slate-50 p-3 rounded-md">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{update.update}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {update.by} ({update.byRole || '物业'}) - {new Date(update.date).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic">暂无进展更新。</p>
          )}
        </div>
      )}
      {canManage && (
        <>
          <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="更新建议状态">
            <div className="space-y-4">
              <Select
                label="选择新状态"
                options={Object.values(SuggestionStatus).map(s => ({label: s, value: s}))}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SuggestionStatus)}
              />
              <Textarea 
                label={`状态更新说明 (${auth.currentUser?.name || '物业'}填写)`}
                placeholder="例如：已派维修师傅处理，预计明日完成。"
                value={statusUpdateText}
                onChange={(e) => setStatusUpdateText(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowStatusModal(false)}>取消</Button>
                <Button onClick={handleStatusUpdateSubmit}>确认更新</Button>
              </div>
            </div>
          </Modal>

          <Modal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)} title="添加进展说明">
            <div className="space-y-4">
              <Textarea 
                label={`进展内容 (${auth.currentUser?.name || '物业'}填写)`}
                placeholder="例如：已完成初步勘查，正在制定维修方案。"
                value={progressText}
                onChange={(e) => setProgressText(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowProgressModal(false)}>取消</Button>
                <Button onClick={handleProgressSubmit}>添加进展</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};


const SuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  const fetchSuggestionsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (err) {
      setError('获取建议列表失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestionsData();
  }, [fetchSuggestionsData]);

  const handleAddSuggestion = async (suggestionData: Omit<Suggestion, 'id' | 'submittedDate' | 'status' | 'progressUpdates'>) => {
    try {
      await addSuggestion(suggestionData);
      fetchSuggestionsData(); 
    } catch (err) {
      alert('提交建议失败，请重试。');
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, status: SuggestionStatus, updateText: string) => {
    try {
      await updateSuggestionStatus(id, status, updateText); // dataService now handles who made the update
      fetchSuggestionsData();
    } catch (err) {
      alert('更新状态失败，请重试。');
    }
  };
  
  const handleAddProgressUpdate = async (id: string, updateText: string) => {
     try {
      await addSuggestionProgress(id, updateText); // dataService now handles who made the update
      fetchSuggestionsData();
    } catch (err) {
      alert('添加进展失败，请重试。');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">物业建议箱</h1>
        {auth?.currentUser && (
             <Button variant="primary" onClick={() => setIsFormOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
                提交新建议
            </Button>
        )}
      </div>

      <SuggestionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddSuggestion}
      />

      {suggestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <LightbulbIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-xl text-slate-600">目前还没有任何建议。</p>
          {auth?.currentUser && <p className="text-slate-500">您可以点击右上角的按钮，成为第一个提交建议的人！</p>}
        </div>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          {suggestions.map((suggestion) => (
            <SuggestionItem 
                key={suggestion.id} 
                suggestion={suggestion} 
                onStatusChange={handleStatusChange} 
                onAddProgress={handleAddProgressUpdate} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionsPage;
