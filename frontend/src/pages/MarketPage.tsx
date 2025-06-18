import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketItem } from '../types';
import { getMarketItems, getMarketItem, addMarketItem, addMarketItemComment, toggleMarketItemLike } from '../services/apiService';
import { Button, LoadingSpinner, Badge, Modal } from '../components/UIElements';
import { PlusCircleIcon, ShoppingBagIcon } from '../components/Icons';
import MarketItemForm from '../components/MarketItemForm';
import MyItemsModal from '../components/MyItemsModal';
import ImageViewer from '../components/ImageViewer';
import ShareButton from '../components/ShareButton';
import MarketItemCard from '../components/MarketItemCard';
import { useAuth } from '../contexts/AuthContext';
import { getItemImages } from '../utils/imageUtils';




const MarketItemDetailModal: React.FC<{item: MarketItem | null; isOpen: boolean; onClose: () => void;}> = ({ item, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  if (!item) return null;

  // 获取图片数组，使用工具函数构建完整URL
  const images = getItemImages(item);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 重置图片索引当模态框打开时
  React.useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.title} size="md">
      <div className="space-y-4">
        {images.length > 0 && (
          <div className="relative">
            <img 
              src={images[currentImageIndex]} 
              alt={`${item.title} - 图片 ${currentImageIndex + 1}`} 
              className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setShowImageViewer(true)}
              title="点击查看大图"
            />
            
            {images.length > 1 && (
              <>
                {/* 图片导航按钮 */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                >
                  ›
                </button>
                
                {/* 图片指示器 */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
                
                {/* 图片计数 */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}
          </div>
        )}
        
        <div>
          <p className="text-3xl font-bold text-secondary mb-2">¥{item.price.toFixed(2)}</p>
          <Badge color="slate" className="mb-3">{item.category}</Badge>
        </div>
        <div className="prose prose-sm max-w-none">
            <h4 className="font-semibold text-slate-700">物品描述:</h4>
            <p className="text-slate-600 whitespace-pre-wrap">{item.description}</p>
        </div>
        <div className="text-sm text-slate-600 space-y-1 border-t pt-4 mt-4">
            <div className="flex items-center space-x-1">
              <span className="font-semibold">卖家:</span> 
              <span>{item.seller}</span>
              {item.sellerVerified && (
                <span className="inline-flex items-center ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
                  ✓ 已认证
                </span>
              )}
            </div>
            <p><span className="font-semibold">发布日期:</span> {new Date(item.postedDate).toLocaleDateString()}</p>
            {item.contactInfo && <p><span className="font-semibold">联系方式:</span> {item.contactInfo}</p>}
        </div>
        <div className="flex justify-between items-center pt-4">
          <ShareButton
            itemId={item.id}
            itemType="market"
            title={item.title}
            size="sm"
            variant="outline"
          />
          <Button variant="primary" onClick={onClose}>关闭</Button>
        </div>
      </div>

      {/* 图片查看器 */}
      <ImageViewer
        images={images}
        currentIndex={currentImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
        title={item.title}
      />
    </Modal>
  );
};

const MarketPage: React.FC = () => {
  const { id: itemId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMyItemsOpen, setIsMyItemsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
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
      console.log('[MarketPage] 开始获取市场物品...');
      console.log('[MarketPage] API基础地址:', window.location.hostname);
      console.log('[MarketPage] User Agent:', navigator.userAgent);
      
      const data = await getMarketItems();
      
      console.log('[MarketPage] API响应成功，数据类型:', typeof data);
      console.log('[MarketPage] 是否为数组:', Array.isArray(data));
      console.log('[MarketPage] 数据长度:', Array.isArray(data) ? data.length : 'N/A');
      console.log('[MarketPage] 前3条数据:', data?.slice ? data.slice(0, 3) : data);
      
      setMarketItems(data);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err as Error;
      console.error('[MarketPage] 获取市场物品失败:', error);
      console.error('[MarketPage] 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = '获取物品列表失败';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += ' (网络连接问题)';
      }
      
      setError(errorMessage);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 处理分享链接 - 如果URL中有itemId，则获取并显示该物品详情
  useEffect(() => {
    const handleSharedItem = async () => {
      if (itemId && !isLoadingAuth) {
        try {
          setIsLoading(true);
          const item = await getMarketItem(itemId);
          setSelectedItem(item);
          // 同时加载所有物品列表
          await fetchMarketItemsData(false);
          setupAutoRefresh();
        } catch (error) {
          console.error('获取分享物品失败:', error);
          setError('物品不存在或已被删除');
          // 如果物品不存在，导航到市场页面
          navigate('/market', { replace: true });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (itemId) {
      handleSharedItem();
    } else if (!isLoadingAuth) {
      fetchMarketItemsData();
      setupAutoRefresh();
    }
  }, [itemId, isLoadingAuth, fetchMarketItemsData, navigate]);

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

  const handleAddItem = async (itemData: Omit<MarketItem, 'id' | 'postedDate'>, files: File[]) => {
    try {
      await addMarketItem(itemData, files);
      fetchMarketItemsData(true);
    } catch (err) {
      alert('发布物品失败，请重试。');
      console.error(err);
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
    // 如果是通过分享链接访问的，关闭详情后导航到市场页面
    if (itemId) {
      navigate('/market', { replace: true });
    }
  };

  const handleEditItem = (item: MarketItem) => {
    setEditingItem(item);
  };

  const handleEditSubmit = async (itemData: Omit<MarketItem, 'id' | 'postedDate'>, files: File[]) => {
    try {
      // TODO: 实现编辑API调用
      console.log('编辑物品:', itemData, files);
      alert('编辑功能正在开发中...');
      setEditingItem(null);
      fetchMarketItemsData(true);
    } catch (err) {
      alert('编辑物品失败，请重试。');
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">个人闲置市场</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">发布和浏览moma内的闲置物品，让资源得到更好的利用。</p>
            {lastUpdated && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                最后更新: {lastUpdated.toLocaleTimeString()} 
                {isRefreshing && <span className="ml-2 text-blue-500">刷新中...</span>}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            { currentUser ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsMyItemsOpen(true)} 
                  leftIcon={<ShoppingBagIcon className="w-4 h-4" />} 
                  size="sm"
                  className="text-sm"
                >
                  我的物品
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setIsFormOpen(true)} 
                  leftIcon={<PlusCircleIcon className="w-4 h-4" />}
                  size="sm"
                  className="text-sm"
                >
                  发布闲置
                </Button>
              </>
            ) : (
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/login'}
                leftIcon={<PlusCircleIcon className="w-4 h-4" />}
                size="sm"
                className="text-sm"
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
        onItemUpdated={() => fetchMarketItemsData(true)}
      />
      
      <MarketItemDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={handleCloseDetails} />

      {/* 编辑物品表单 */}
      {editingItem && (
        <MarketItemForm
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEditSubmit}
          initialData={editingItem}
          isEditing={true}
        />
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {marketItems.map((item, index) => (
            <MarketItemCard
              key={`market-item-${item.id}-${index}`}
              item={item}
              onAddComment={handleAddComment}
              onToggleLike={handleToggleLike}
              onEditItem={handleEditItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketPage;
