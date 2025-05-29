import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Suggestion, SuggestionStatus, UserRole } from '../types';
import { getSuggestions, addSuggestion, updateSuggestionStatus, addSuggestionProgress } from '../services/apiService';
import { Button, LoadingSpinner, Badge, Modal, Textarea, Select } from '../components/UIElements';
import { PlusCircleIcon, ChevronDownIcon, ChatBubbleLeftEllipsisIcon, LightbulbIcon, ArrowPathIcon } from '../components/Icons';
import SuggestionForm from '../components/SuggestionForm';
import { AuthContext, useAuth } from '../contexts/AuthContext';

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
                label={`状态更新说明 (${auth?.currentUser?.name || '物业'}填写)`}
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
                label={`进展内容 (${auth?.currentUser?.name || '物业'}填写)`}
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
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { currentUser, isLoadingAuth } = useAuth();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  useEffect(() => {
    lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

  const fetchSuggestionsData = useCallback(async (showRefreshIndicator = false) => {
    if (!currentUser) {
      setIsDataLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsDataLoading(true);
    }
    setError(null);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        setError('您的登录已过期或无效，请重新登录后查看建议。');
      } else {
        setError('获取建议列表失败，请稍后重试。');
      }
      console.error(err);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      fetchSuggestionsData();
      setupAutoRefresh();
    } else if (!isLoadingAuth && !currentUser) {
      setSuggestions([]);
      setIsLoading(false);
      setError("请登录后查看或提交建议。");
    }
  }, [isLoadingAuth, currentUser, fetchSuggestionsData]);

  const handleManualRefresh = useCallback(() => {
    if (currentUser) fetchSuggestionsData(true);
  }, [fetchSuggestionsData, currentUser]);

  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      if (currentUser) fetchSuggestionsData(true);
    }, 30000);
  }, [fetchSuggestionsData, currentUser]);

  const handleWindowFocus = useCallback(() => {
    if (!currentUser || !lastUpdatedRef.current) return;
    const timeSinceLastUpdate = Date.now() - lastUpdatedRef.current.getTime();
    if (timeSinceLastUpdate > 10000) {
      fetchSuggestionsData(true);
    }
  }, [fetchSuggestionsData, currentUser]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      window.addEventListener('focus', handleWindowFocus);
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          handleWindowFocus();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isLoadingAuth, currentUser, handleWindowFocus, setupAutoRefresh]);

  useEffect(() => {
    if (!isLoadingAuth) {
      setIsLoading(false);
    }
  }, [isLoadingAuth]);

  const handleAddSuggestion = async (suggestionData: { title: string; description: string; category: string }) => {
    if (!currentUser) {
      alert("请先登录后再提交建议。");
      return;
    }
    try {
      await addSuggestion(suggestionData);
      fetchSuggestionsData(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交建议失败，请重试。';
      alert(`提交建议失败: ${errorMessage}`);
      console.error('提交建议详细错误:', err);
    }
  };
  
  const handleStatusChange = async (id: string, status: SuggestionStatus, updateText: string) => {
    try {
      await updateSuggestionStatus(id, status, updateText);
      fetchSuggestionsData(true);
    } catch (err) {
      alert('更新状态失败，请重试。');
      console.error(err);
    }
  };
  
  const handleAddProgressUpdate = async (id: string, updateText: string) => {
    try {
      await addSuggestionProgress(id, updateText);
      fetchSuggestionsData(true);
    } catch (err) {
      alert('添加进展失败，请重试。');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (!currentUser && error) {
    return (
        <div className="text-center py-12">
            <LightbulbIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-xl text-slate-600 mb-2">{error}</p>
            <Button variant="primary" onClick={() => window.location.href = '/login'}>前往登录</Button>
        </div>
    );
  }
  
  if (currentUser && error) {
    return (
      <div className="space-y-4">
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
        <div className="text-center">
          <Button variant="primary" onClick={handleManualRefresh} disabled={isRefreshing || isDataLoading}>
            {isRefreshing || isDataLoading ? '重试中...' : '重试'}
          </Button>
        </div>
      </div>
    );
  }

  if (isDataLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">物业建议与反馈</h1>
          {lastUpdated && (
            <p className="text-sm text-slate-500 mt-1">
              最后更新: {lastUpdated.toLocaleTimeString()} 
              {isRefreshing && <span className="ml-2 text-blue-500">刷新中...</span>}
            </p>
          )}
        </div>
        {currentUser && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleManualRefresh} 
              disabled={isRefreshing || isDataLoading}
              leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              size="sm"
            >
              刷新
            </Button>
            <Button variant="secondary" onClick={() => setIsFormOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
                我有建议
            </Button>
          </div>
        )}
      </div>

      {currentUser && <SuggestionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddSuggestion}
      />}
      
      {suggestions.length === 0 && !isDataLoading && currentUser ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <LightbulbIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-xl text-slate-600">暂无建议，期待您的声音！</p>
        </div>
      ) : (
        <div className="space-y-6">
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

