import React, { useState, useEffect, useCallback } from 'react';
import { getMarketItems, adminDeleteMarketItem } from '../../services/apiService';
import { MarketItem } from '../../types';
import { Button, LoadingSpinner, Badge, Modal } from '../UIElements';
import { TrashIcon, ShoppingBagIcon, CheckBadgeIcon } from '../Icons';
import ImageViewer from '../ImageViewer';
import { buildImageUrl } from '../../utils/imageUtils';

const MarketManagementTab: React.FC = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<MarketItem | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMarketItems(); // Admin sees all items
      setItems(data);
    } catch (err) {
      setError('获取闲置物品列表失败。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (window.confirm(`确定要删除物品 "${itemTitle}" 吗？此操作不可撤销。`)) {
      try {
        const success = await adminDeleteMarketItem(itemId);
        if (success) {
          fetchItems(); // Refresh list
        } else {
          alert('删除物品失败。');
        }
      } catch (err) {
        alert('删除物品时出错。');
        console.error(err);
      }
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-2xl font-semibold text-slate-700">
        <ShoppingBagIcon className="w-8 h-8" />
        <span>个人闲置市场管理</span>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">图片</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">价格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">卖家</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">发布日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                <img src={buildImageUrl(item.imageUrl)} alt={item.title} className="w-16 h-16 object-cover rounded-md"/>
              </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 max-w-xs truncate" title={item.title}>{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">¥{item.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <span>{item.seller}</span>
                    {item.sellerVerified && (
                      <span title="已认证用户">
                        <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(item.postedDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => setItemToView(item)} className="mr-2 text-blue-600 hover:text-blue-800">
                    查看
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id, item.title)} aria-label="删除物品">
                    <TrashIcon className="w-4 h-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="text-slate-500 text-center py-5">市场中没有物品。</p>}
      
      {itemToView && (
         <Modal isOpen={!!itemToView} onClose={() => setItemToView(null)} title={itemToView.title} size="md">
            <div className="space-y-4">
                <img 
                  src={buildImageUrl(itemToView.imageUrl)} 
                  alt={itemToView.title} 
                  className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => setShowImageViewer(true)}
                  title="点击查看大图"
                />
                <div>
                <p className="text-3xl font-bold text-secondary mb-2">¥{itemToView.price.toFixed(2)}</p>
                <Badge color="slate" className="mb-3">{itemToView.category}</Badge>
                </div>
                <div className="prose prose-sm max-w-none">
                    <h4 className="font-semibold text-slate-700">物品描述:</h4>
                    <p className="text-slate-600 whitespace-pre-wrap">{itemToView.description}</p>
                </div>
                <div className="text-sm text-slate-600 space-y-1 border-t pt-4 mt-4">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">卖家:</span> 
                      <span>{itemToView.seller}</span>
                      {itemToView.sellerVerified && (
                        <span title="已认证用户">
                          <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                        </span>
                      )}
                    </div>
                    <p><span className="font-semibold">发布日期:</span> {new Date(itemToView.postedDate).toLocaleDateString()}</p>
                    {itemToView.contactInfo && <p><span className="font-semibold">联系方式:</span> {itemToView.contactInfo}</p>}
                </div>
                <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setItemToView(null)}>关闭</Button>
                </div>
            </div>

            {/* 图片查看器 */}
            <ImageViewer
              images={[buildImageUrl(itemToView.imageUrl)].filter(Boolean)}
              currentIndex={currentImageIndex}
              isOpen={showImageViewer}
              onClose={() => setShowImageViewer(false)}
              onIndexChange={setCurrentImageIndex}
              title={itemToView.title}
            />
        </Modal>
      )}
    </div>
  );
};

export default MarketManagementTab;
