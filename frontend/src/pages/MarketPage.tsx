import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { MarketItem } from '../types';
import { getMarketItems, addMarketItem, addMarketItemComment, toggleMarketItemLike } from '../services/apiService';
import { Button, LoadingSpinner, Badge, Modal, Textarea } from '../components/UIElements';
import { PlusCircleIcon, ChevronDownIcon, ChatBubbleLeftEllipsisIcon, ShoppingBagIcon, ArrowPathIcon, HandThumbUpIcon, ChatBubbleLeftIcon } from '../components/Icons';
import MarketItemForm from '../components/MarketItemForm';
import MyItemsModal from '../components/MyItemsModal';
import { AuthContext, useAuth } from '../contexts/AuthContext';

const MarketItemCard: React.FC<{ 
    item: MarketItem; 
    onAddComment: (id: string, content: string) => void;
    onToggleLike: (id: string) => void;
}> = ({ item, onAddComment, onToggleLike }) => {
  const auth = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = () => {
    if (!commentText.trim()) {
      alert("请输入评论内容。");
      return;
    }
    onAddComment(item.id, commentText);
    setShowCommentModal(false);
    setCommentText('');
  };

  const handleLikeClick = () => {
    if (!auth?.currentUser) {
      window.location.href = '/login';
      return;
    }
    onToggleLike(item.id);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 transition-shadow duration-300 hover:shadow-xl">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-800 mb-1">{item.title}</h3>
          <p className="text-sm text-slate-500">由 {item.seller} 于 {new Date(item.postedDate).toLocaleDateString()} 发布</p>
          <p className="text-sm text-slate-500">类别: {item.category}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-secondary mb-2">¥{item.price.toFixed(2)}</p>
          <Badge color="slate">{item.category}</Badge>
        </div>
      </div>
      
      {item.imageUrl && (
        <div className="mt-4 mb-4">
          <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-lg shadow-md" />
        </div>
      )}
      
      <p className="text-slate-700 mt-3 mb-4 whitespace-pre-wrap">{item.description}</p>
      
      {item.contactInfo && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">联系方式:</span> {item.contactInfo}
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div />
        <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)} 
            rightIcon={<ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
            className="text-xs"
        >
            {expanded ? '收起评论' : '查看评论'} ({item.comments?.length || 0})
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {/* 评论区 */}
          {item.comments && item.comments.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">用户评论</h4>
              <div className="space-y-2">
                {item.comments.map((comment) => (
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

          {(!item.comments || item.comments.length === 0) && (
            <p className="text-sm text-slate-500 italic">暂无评论。</p>
          )}
        </div>
      )}

      {/* 点赞和评论统计 */}
      <div className="flex items-center space-x-4 pt-2 border-t border-slate-100">
        <button
          onClick={handleLikeClick}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
            item.isLikedByCurrentUser 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HandThumbUpIcon className="w-4 h-4" />
          <span>{item.likeCount || 0}</span>
        </button>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-1 px-3 py-1 rounded-md text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          <span>{item.comments?.length || 0} 评论</span>
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {expanded ? '收起' : '展开详情'}
        </button>

        {auth?.currentUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentModal(true)}
          >
            添加评论
          </Button>
        )}
        {!auth?.currentUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            登录后评论
          </Button>
        )}
      </div>

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

const MarketItemDetailModal: React.FC<{item: MarketItem | null; isOpen: boolean; onClose: () => void;}> = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.title} size="md">
      <div className="space-y-4">
        <img src={item.imageUrl} alt={item.title} className="w-full h-64 object-cover rounded-lg shadow-md" />
        <div>
          <p className="text-3xl font-bold text-secondary mb-2">¥{item.price.toFixed(2)}</p>
          <Badge color="slate" className="mb-3">{item.category}</Badge>
        </div>
        <div className="prose prose-sm max-w-none">
            <h4 className="font-semibold text-slate-700">物品描述:</h4>
            <p className="text-slate-600 whitespace-pre-wrap">{item.description}</p>
        </div>
        <div className="text-sm text-slate-600 space-y-1 border-t pt-4 mt-4">
            <p><span className="font-semibold">卖家:</span> {item.seller}</p>
            <p><span className="font-semibold">发布日期:</span> {new Date(item.postedDate).toLocaleDateString()}</p>
            {item.contactInfo && <p><span className="font-semibold">联系方式:</span> {item.contactInfo}</p>}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}

const MarketPage: React.FC = () => {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMyItemsOpen, setIsMyItemsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { currentUser, isLoadingAuth } = useAuth();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  useEffect(() => {
    lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

  const fetchMarketItemsData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsDataLoading(true);
    }
    setError(null);
    try {
      const data = await getMarketItems();
      setMarketItems(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('获取闲置物品列表失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      fetchMarketItemsData();
      setupAutoRefresh();
    }
  }, [isLoadingAuth, fetchMarketItemsData]);

  const handleManualRefresh = useCallback(() => {
    fetchMarketItemsData(true);
  }, [fetchMarketItemsData]);

  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      fetchMarketItemsData(true);
    }, 30000);
  }, [fetchMarketItemsData]);

  const handleWindowFocus = useCallback(() => {
    if (!lastUpdatedRef.current) return;
    const timeSinceLastUpdate = Date.now() - lastUpdatedRef.current.getTime();
    if (timeSinceLastUpdate > 10000) {
      fetchMarketItemsData(true);
    }
  }, [fetchMarketItemsData]);

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

  const handleAddItem = async (itemData: Omit<MarketItem, 'id' | 'postedDate'>) => {
    if (!currentUser) {
      alert("请先登录后再发布物品。");
      return;
    }
    try {
      await addMarketItem(itemData);
      fetchMarketItemsData(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发布物品失败，请重试。';
      alert(`发布物品失败: ${errorMessage}`);
      console.error('发布物品详细错误:', err);
    }
  };

  const handleAddComment = async (id: string, content: string) => {
    try {
      await addMarketItemComment(id, content);
      fetchMarketItemsData(true);
    } catch (err) {
      alert('添加评论失败，请重试。');
      console.error(err);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      await toggleMarketItemLike(id);
      fetchMarketItemsData(true);
    } catch (err) {
      alert('点赞操作失败，请重试。');
      console.error(err);
    }
  };

  const handleShowDetails = (item: MarketItem) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
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
    <div className="space-y-8">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">个人闲置市场</h1>
            <p className="text-slate-600 mt-2">发布和浏览moma内的闲置物品，让资源得到更好的利用。</p>
            {lastUpdated && (
              <p className="text-sm text-slate-500 mt-1">
                最后更新: {lastUpdated.toLocaleTimeString()} 
                {isRefreshing && <span className="ml-2 text-blue-500">刷新中...</span>}
              </p>
            )}
        </div>
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
          { currentUser ? (
                <>
                  <Button variant="outline" onClick={() => setIsMyItemsOpen(true)} leftIcon={<ShoppingBagIcon className="w-4 h-4" />} size="sm">
                    我的物品
                  </Button>
              <Button variant="secondary" onClick={() => setIsFormOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
                  发布闲置
              </Button>
                </>
          ) : (
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/login'}
              leftIcon={<PlusCircleIcon className="w-4 h-4" />}
              size="sm"
            >
              登录后发布你的闲置
            </Button>
          )}
          </div>
        </div>
      </div>

      <MarketItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddItem}
      />
      
      <MyItemsModal
        isOpen={isMyItemsOpen}
        onClose={() => setIsMyItemsOpen(false)}
        onItemDeleted={() => fetchMarketItemsData(true)}
      />
      
      <MarketItemDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={handleCloseDetails} />

      {marketItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <ShoppingBagIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-xl text-slate-600">暂无闲置物品～</p>
          {currentUser ? (
            <p className="text-slate-500">您可以点击右上角的按钮，发布您的第一件闲置物品！</p>
          ) : (
            <div className="mt-4">
              <p className="text-slate-500 mb-3">想要发布闲置物品？</p>
              <Button variant="primary" onClick={() => window.location.href = '/login'}>
                立即登录
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {marketItems.map((item) => (
            <MarketItemCard 
              key={item.id} 
              item={item} 
              onAddComment={handleAddComment}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketPage;
