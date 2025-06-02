import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Suggestion, SuggestionStatus, UserRole } from '../types';
import { getSuggestions, addSuggestion, updateSuggestionStatus, addSuggestionProgress, addSuggestionComment, toggleSuggestionLike } from '../services/apiService';
import { Button, LoadingSpinner, Badge, Modal, Textarea, Select } from '../components/UIElements';
import { PlusCircleIcon, ChevronDownIcon, ChatBubbleLeftEllipsisIcon, LightbulbIcon, ArrowPathIcon, HandThumbUpIcon, ChatBubbleLeftIcon } from '../components/Icons';
import SuggestionForm from '../components/SuggestionForm';
import { AuthContext, useAuth } from '../contexts/AuthContext';

const SuggestionItem: React.FC<{ 
    suggestion: Suggestion; 
    onStatusChange: (id: string, status: SuggestionStatus, updateText: string) => void; 
    onAddProgress: (id: string, updateText: string) => void; 
    onAddComment: (id: string, content: string) => void;
    onToggleLike: (id: string) => void;
}> = ({ suggestion, onStatusChange, onAddProgress, onAddComment, onToggleLike }) => {
  const auth = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newStatus, setNewStatus] = useState<SuggestionStatus>(suggestion.status);
  const [statusUpdateText, setStatusUpdateText] = useState('');
  const [progressText, setProgressText] = useState('');
  const [commentText, setCommentText] = useState('');

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

  const handleCommentSubmit = () => {
    if (!commentText.trim()) {
      alert("请输入评论内容。");
      return;
    }
    onAddComment(suggestion.id, commentText);
    setShowCommentModal(false);
    setCommentText('');
  };

  const handleLikeClick = () => {
    if (!auth?.currentUser) {
      window.location.href = '/login';
      return;
    }
    onToggleLike(suggestion.id);
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

      {/* 点赞和评论统计 */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-3 border-t border-slate-100">
        <button
          onClick={handleLikeClick}
          className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${
            suggestion.isLikedByCurrentUser 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HandThumbUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{suggestion.likeCount || 0}</span>
        </button>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ChatBubbleLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{suggestion.comments?.length || 0} 评论</span>
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-1"
        >
          {expanded ? '收起' : '展开详情'}
        </button>

        {auth?.currentUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentModal(true)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1"
          >
            添加评论
          </Button>
        )}
        {!auth?.currentUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/login'}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1"
          >
            登录后评论
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {/* 评论区 */}
          {suggestion.comments && suggestion.comments.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">用户评论</h4>
              <div className="space-y-2">
                {suggestion.comments.map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {comment.userName} - {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestion.progressUpdates.length === 0 && (!suggestion.comments || suggestion.comments.length === 0) && (
            <p className="text-sm text-slate-500 italic">暂无进展更新和评论。</p>
          )}
        </div>
      )}

      {/* 评论模态框 */}
      <Modal isOpen={showCommentModal} onClose={() => setShowCommentModal(false)} title="添加评论">
        <div className="space-y-4">
          <Textarea 
            label="评论内容"
            placeholder="请输入您的评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowCommentModal(false)}>取消</Button>
            <Button onClick={handleCommentSubmit}>发表评论</Button>
          </div>
        </div>
      </Modal>
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
      setError('获取建议列表失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      fetchSuggestionsData();
      setupAutoRefresh();
    }
  }, [isLoadingAuth, fetchSuggestionsData]);

  const handleManualRefresh = useCallback(() => {
    fetchSuggestionsData(true);
  }, [fetchSuggestionsData]);

  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      fetchSuggestionsData(true);
    }, 30000);
  }, [fetchSuggestionsData]);

  const handleWindowFocus = useCallback(() => {
    if (!lastUpdatedRef.current) return;
    const timeSinceLastUpdate = Date.now() - lastUpdatedRef.current.getTime();
    if (timeSinceLastUpdate > 10000) {
      fetchSuggestionsData(true);
    }
  }, [fetchSuggestionsData]);

  useEffect(() => {
    if (!isLoadingAuth) {
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
  }, [isLoadingAuth, handleWindowFocus, setupAutoRefresh]);

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

  const handleAddComment = async (id: string, content: string) => {
    try {
      await addSuggestionComment(id, content);
      fetchSuggestionsData(true);
    } catch (err) {
      alert('添加评论失败，请重试。');
      console.error(err);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      await toggleSuggestionLike(id);
      fetchSuggestionsData(true);
    } catch (err) {
      alert('点赞操作失败，请重试。');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">个人物业建议与反馈</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">对moma管理、设施有任何建议或问题？请在这里提出，物业将及时跟进处理，并公示进度。</p>
          {lastUpdated && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              最后更新: {lastUpdated.toLocaleTimeString()} 
              {isRefreshing && <span className="ml-2 text-blue-500">刷新中...</span>}
            </p>
          )}
        </div>
        {currentUser && (
          <div className="flex justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setIsFormOpen(true)} 
              leftIcon={<PlusCircleIcon className="w-4 h-4" />}
              size="sm"
              className="text-sm"
            >
              我有建议
            </Button>
          </div>
        )}
        {!currentUser && (
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/login'}
              size="sm"
              className="text-sm"
            >
              登录后提交建议
            </Button>
          </div>
        )}
      </div>

      {currentUser && <SuggestionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddSuggestion}
      />}
      
      {suggestions.length === 0 && !isDataLoading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <LightbulbIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-xl text-slate-600">暂无建议，期待您的声音！</p>
          {!currentUser && (
            <div className="mt-4">
              <p className="text-slate-500 mb-3">想要提交建议？</p>
              <Button variant="primary" onClick={() => window.location.href = '/login'}>
                立即登录
              </Button>
            </div>
          )}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-6">
          {suggestions.map((suggestion) => (
            <SuggestionItem 
                key={suggestion.id} 
                suggestion={suggestion} 
                onStatusChange={handleStatusChange} 
                onAddProgress={handleAddProgressUpdate} 
                onAddComment={handleAddComment}
                onToggleLike={handleToggleLike}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SuggestionsPage;

