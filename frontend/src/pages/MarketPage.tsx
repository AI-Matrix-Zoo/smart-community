import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { MarketItem } from '../types';
import { getMarketItems, addMarketItem } from '../services/dataService';
import { Button, LoadingSpinner, Modal, Badge } from '../components/UIElements';
import { PlusCircleIcon, ShoppingBagIcon, ArrowPathIcon } from '../components/Icons';
import MarketItemForm from '../components/MarketItemForm';
import { AuthContext } from '../contexts/AuthContext';

const MarketItemCard: React.FC<{ item: MarketItem; onShowDetails: (item: MarketItem) => void; }> = ({ item, onShowDetails }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 truncate" title={item.title}>{item.title}</h3>
        <p className="text-2xl font-bold text-secondary mb-3">¥{item.price.toFixed(2)}</p>
        <Badge color="slate" className="mb-3 self-start">{item.category}</Badge>
        <p className="text-sm text-slate-600 flex-grow mb-3 line-clamp-2">{item.description}</p>
        <p className="text-xs text-slate-500 mb-1">卖家: {item.seller}</p>
        <p className="text-xs text-slate-500">发布于: {new Date(item.postedDate).toLocaleDateString()}</p>
        <Button variant="primary" size="sm" onClick={() => onShowDetails(item)} className="mt-4 w-full">
          查看详情
        </Button>
      </div>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const auth = useContext(AuthContext);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarketItemsData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    fetchMarketItemsData(true);
  }, [fetchMarketItemsData]);

  // 设置定期刷新
  const setupAutoRefresh = useCallback(() => {
    // 清除现有的定时器
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // 每30秒自动刷新一次
    refreshIntervalRef.current = setInterval(() => {
      fetchMarketItemsData(true);
    }, 30000);
  }, [fetchMarketItemsData]);

  // 窗口焦点事件处理
  const handleWindowFocus = useCallback(() => {
    // 当窗口重新获得焦点时，如果距离上次更新超过10秒，则刷新数据
    const timeSinceLastUpdate = Date.now() - lastUpdated.getTime();
    if (timeSinceLastUpdate > 10000) {
      fetchMarketItemsData(true);
    }
  }, [fetchMarketItemsData, lastUpdated]);

  useEffect(() => {
    fetchMarketItemsData();
    setupAutoRefresh();

    // 添加窗口焦点事件监听
    window.addEventListener('focus', handleWindowFocus);
    
    // 添加页面可见性变化监听
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleWindowFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理定时器和事件监听
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMarketItemsData, setupAutoRefresh, handleWindowFocus]);

  const handleAddItem = async (itemData: Omit<MarketItem, 'id' | 'postedDate'>) => {
    try {
      await addMarketItem(itemData);
      // 立即刷新数据以显示新添加的物品
      fetchMarketItemsData(true); 
    } catch (err) {
       alert('发布物品失败，请重试。');
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
          <Button variant="primary" onClick={handleManualRefresh} disabled={isRefreshing}>
            {isRefreshing ? '重试中...' : '重试'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">小区闲置市场</h1>
          <p className="text-sm text-slate-500 mt-1">
            最后更新: {lastUpdated.toLocaleTimeString()} 
            {isRefreshing && <span className="ml-2 text-blue-500">刷新中...</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            leftIcon={<ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            size="sm"
          >
            刷新
          </Button>
          { auth?.currentUser && (
              <Button variant="secondary" onClick={() => setIsFormOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
                  发布闲置
              </Button>
          )}
        </div>
      </div>

      <MarketItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddItem}
      />
      
      <MarketItemDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={handleCloseDetails} />

      {marketItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <ShoppingBagIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-xl text-slate-600">市场空空如也～</p>
          { auth?.currentUser && <p className="text-slate-500">您可以点击右上角的按钮，发布您的第一件闲置物品！</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {marketItems.map((item) => (
            <MarketItemCard key={item.id} item={item} onShowDetails={handleShowDetails} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketPage;
