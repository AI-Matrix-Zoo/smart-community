import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Suggestion, SuggestionStatus } from '../../types';
import { getSuggestions, updateSuggestionStatus, addSuggestionProgress, adminDeleteSuggestion } from '../../services/dataService';
import { AuthContext } from '../../contexts/AuthContext';
import { Button, LoadingSpinner, Badge, Modal, Select, Textarea } from '../UIElements';
import { TrashIcon, ChatBubbleLeftEllipsisIcon, LightbulbIcon, ChevronDownIcon } from '../Icons';

const SuggestionManagementTab: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  const [selectedSuggestionForStatus, setSelectedSuggestionForStatus] = useState<Suggestion | null>(null);
  const [newStatus, setNewStatus] = useState<SuggestionStatus>(SuggestionStatus.Submitted);
  const [statusUpdateText, setStatusUpdateText] = useState('');

  const [selectedSuggestionForProgress, setSelectedSuggestionForProgress] = useState<Suggestion | null>(null);
  const [progressText, setProgressText] = useState('');
  
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);


  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSuggestions(); // Admin sees all suggestions
      setSuggestions(data);
    } catch (err) {
      setError('获取建议列表失败。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const openStatusModal = (suggestion: Suggestion) => {
    setSelectedSuggestionForStatus(suggestion);
    setNewStatus(suggestion.status);
    setStatusUpdateText('');
  };

  const handleStatusUpdateSubmit = async () => {
    if (!selectedSuggestionForStatus || !statusUpdateText.trim()) {
      alert("请选择建议并输入状态更新说明。");
      return;
    }
    try {
      await updateSuggestionStatus(selectedSuggestionForStatus.id, newStatus, statusUpdateText);
      fetchSuggestions();
      setSelectedSuggestionForStatus(null);
    } catch (err) {
      alert('更新状态失败。');
    }
  };
  
  const openProgressModal = (suggestion: Suggestion) => {
    setSelectedSuggestionForProgress(suggestion);
    setProgressText('');
  };

  const handleProgressSubmit = async () => {
    if (!selectedSuggestionForProgress || !progressText.trim()) {
      alert("请选择建议并输入进展内容。");
      return;
    }
    try {
      await addSuggestionProgress(selectedSuggestionForProgress.id, progressText);
      fetchSuggestions();
      setSelectedSuggestionForProgress(null);
    } catch (err) {
      alert('添加进展失败。');
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string, suggestionTitle: string) => {
    if (window.confirm(`确定要删除建议 "${suggestionTitle}" 吗？此操作不可撤销。`)) {
      try {
        const success = await adminDeleteSuggestion(suggestionId);
        if (success) {
          fetchSuggestions(); // Refresh list
        } else {
          alert('删除建议失败。');
        }
      } catch (err) {
        alert('删除建议时出错。');
        console.error(err);
      }
    }
  };
  
  const getStatusColor = (status: SuggestionStatus) => {
    switch (status) {
      case SuggestionStatus.Submitted: return 'sky';
      case SuggestionStatus.InProgress: return 'amber';
      case SuggestionStatus.Resolved: return 'emerald';
      case SuggestionStatus.Rejected: return 'red';
      default: return 'slate';
    }
  };
  
  const toggleExpand = (id: string) => {
    setExpandedSuggestionId(expandedSuggestionId === id ? null : id);
  };


  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-2xl font-semibold text-slate-700">
        <LightbulbIcon className="w-8 h-8" />
        <span>物业建议管理</span>
      </div>

      <div className="space-y-4">
        {suggestions.map((s) => (
          <div key={s.id} className="bg-white shadow-md rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{s.title}</h3>
                <p className="text-xs text-slate-500">
                  由 {s.submittedBy} ({s.category}) 于 {new Date(s.submittedDate).toLocaleDateString()}
                </p>
              </div>
              <Badge color={getStatusColor(s.status)}>{s.status}</Badge>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{s.description}</p>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => openStatusModal(s)} className="text-xs">更新状态</Button>
                    <Button size="sm" variant="ghost" onClick={() => openProgressModal(s)} className="text-xs" leftIcon={<ChatBubbleLeftEllipsisIcon className="w-3 h-3"/>}>添加进展</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSuggestion(s.id, s.title)} aria-label="删除建议" className="text-xs">
                        <TrashIcon className="w-3 h-3 text-red-500 mr-1" />删除
                    </Button>
                </div>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => toggleExpand(s.id)} 
                    rightIcon={<ChevronDownIcon className={`w-3 h-3 transition-transform ${expandedSuggestionId === s.id ? 'rotate-180' : ''}`} />}
                    className="text-xs"
                >
                    {expandedSuggestionId === s.id ? '收起' : '查看'}进展 ({s.progressUpdates.length})
                </Button>
            </div>

            {expandedSuggestionId === s.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                {s.progressUpdates.length > 0 ? (
                    s.progressUpdates.map((update, index) => (
                    <div key={index} className="bg-slate-50 p-2.5 rounded">
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{update.update}</p>
                        <p className="text-xxs text-slate-400 mt-1"> {/* Even smaller text for meta */}
                        {update.by} ({update.byRole || '物业'}) - {new Date(update.date).toLocaleString()}
                        </p>
                    </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-400 italic">暂无进展更新。</p>
                )}
                </div>
            )}
          </div>
        ))}
      </div>
      {suggestions.length === 0 && <p className="text-slate-500 text-center py-5">暂无任何建议。</p>}

      {/* Status Update Modal */}
      {selectedSuggestionForStatus && (
        <Modal isOpen={!!selectedSuggestionForStatus} onClose={() => setSelectedSuggestionForStatus(null)} title="更新建议状态">
          <div className="space-y-4">
            <Select
              label="选择新状态"
              options={Object.values(SuggestionStatus).map(st => ({label: st, value: st}))}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as SuggestionStatus)}
            />
            <Textarea 
              label={`状态更新说明 (${auth?.currentUser?.name || '管理员'}填写)`}
              placeholder="例如：已指派物业处理。"
              value={statusUpdateText}
              onChange={(e) => setStatusUpdateText(e.target.value)}
              required
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setSelectedSuggestionForStatus(null)}>取消</Button>
              <Button onClick={handleStatusUpdateSubmit}>确认更新</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Progress Add Modal */}
      {selectedSuggestionForProgress && (
        <Modal isOpen={!!selectedSuggestionForProgress} onClose={() => setSelectedSuggestionForProgress(null)} title="添加进展说明">
          <div className="space-y-4">
            <Textarea 
              label={`进展内容 (${auth?.currentUser?.name || '管理员'}填写)`}
              placeholder="例如：已完成初步勘查。"
              value={progressText}
              onChange={(e) => setProgressText(e.target.value)}
              required
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setSelectedSuggestionForProgress(null)}>取消</Button>
              <Button onClick={handleProgressSubmit}>添加进展</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuggestionManagementTab;
