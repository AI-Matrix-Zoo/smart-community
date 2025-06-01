import React, { useState, useEffect } from 'react';
import { MarketItem } from '../types';
import { getMyMarketItems, deleteMarketItem } from '../services/apiService';
import { Button, LoadingSpinner, Modal, Badge } from './UIElements';
import { TrashIcon, EyeIcon } from './Icons';

interface MyItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted: () => void;
}

const MyItemsModal: React.FC<MyItemsModalProps> = ({ isOpen, onClose, onItemDeleted }) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  const fetchMyItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyMarketItems();
      setItems(data);
    } catch (err) {
      setError('获取我的物品失败，请重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyItems();
    }
  }, [isOpen]);

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (window.confirm(`确定要删除物品 "${itemTitle}" 吗？此操作不可撤销。`)) {
      try {
        const success = await deleteMarketItem(itemId);
        if (success) {
          fetchMyItems(); // 刷新列表
          onItemDeleted(); // 通知父组件刷新
        } else {
          alert('删除物品失败，请重试。');
        }
      } catch (err) {
        alert('删除物品时出错。');
        console.error(err);
      }
    }
  };

  const handleViewDetails = (item: MarketItem) => {
    setSelectedItem(item);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="我的闲置物品" size="lg">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
              {error}
              <div className="mt-2">
                <Button variant="primary" size="sm" onClick={fetchMyItems}>
                  重试
                </Button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">您还没有发布任何物品</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-grow">
                    <h4 className="font-medium text-slate-800 truncate">{item.title}</h4>
                    <p className="text-lg font-bold text-secondary">¥{item.price.toFixed(2)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge color="slate" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-slate-500">
                        发布于 {new Date(item.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* 物品详情模态框 */}
      {selectedItem && (
        <Modal 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          title={selectedItem.title}
          size="md"
        >
          <div className="space-y-4">
            <img 
              src={selectedItem.imageUrl} 
              alt={selectedItem.title} 
              className="w-full h-64 object-cover rounded-lg shadow-md" 
            />
            <div>
              <p className="text-3xl font-bold text-secondary mb-2">¥{selectedItem.price.toFixed(2)}</p>
              <Badge color="slate" className="mb-3">{selectedItem.category}</Badge>
            </div>
            <div className="prose prose-sm max-w-none">
              <h4 className="font-semibold text-slate-700">物品描述:</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedItem.description}</p>
            </div>
            <div className="text-sm text-slate-600 space-y-1 border-t pt-4 mt-4">
              <p><span className="font-semibold">发布日期:</span> {new Date(selectedItem.postedDate).toLocaleDateString()}</p>
              {selectedItem.contactInfo && (
                <p><span className="font-semibold">联系方式:</span> {selectedItem.contactInfo}</p>
              )}
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleDeleteItem(selectedItem.id, selectedItem.title)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                删除物品
              </Button>
              <Button variant="primary" onClick={() => setSelectedItem(null)}>
                关闭
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MyItemsModal; 