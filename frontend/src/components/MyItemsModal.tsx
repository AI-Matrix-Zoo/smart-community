import React, { useState, useEffect } from 'react';
import { MarketItem } from '../types';
import { getMyMarketItems, deleteMarketItem } from '../services/apiService';
import { Button, LoadingSpinner, Modal, Badge } from './UIElements';
import { TrashIcon, EyeIcon, PencilIcon } from './Icons';
import MarketItemForm from './MarketItemForm';
import ImageViewer from './ImageViewer';
import { getItemImages } from '../utils/imageUtils';

interface MyItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted: () => void;
  onItemUpdated?: () => void;
}

const MyItemsModal: React.FC<MyItemsModalProps> = ({ isOpen, onClose, onItemDeleted, onItemUpdated }) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

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
          setSelectedItem(null); // 关闭详情模态框
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
    setCurrentImageIndex(0); // 重置图片索引
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
      fetchMyItems();
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (err) {
      alert('编辑物品失败，请重试。');
      console.error(err);
    }
  };

  // 图片轮播控制
  const nextImage = (images: string[]) => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (images: string[]) => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 获取图片数组（使用工具函数构建完整URL）
  const getImages = (item: MarketItem): string[] => {
    return getItemImages(item);
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
              {items.map((item) => {
                const images = getImages(item);
                return (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    {/* 图片预览 - 支持多图轮播 */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <img 
                        src={images[0]} 
                        alt={item.title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                      {images.length > 1 && (
                        <div className="absolute top-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 rounded-bl">
                          {images.length}
                        </div>
                      )}
                    </div>
                    
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
                        title="查看详情"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="text-green-600 hover:text-green-800"
                        title="编辑物品"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="text-red-600 hover:text-red-800"
                        title="删除物品"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* 物品详情模态框 - 支持多图轮播 */}
      {selectedItem && (
        <Modal 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          title={selectedItem.title}
          size="md"
        >
          <div className="space-y-4">
            {(() => {
              const images = getImages(selectedItem);
              return (
                <div className="relative">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`${selectedItem.title} - 图片 ${currentImageIndex + 1}`} 
                    className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => setShowImageViewer(true)}
                    title="点击查看大图"
                  />
                  
                  {images.length > 1 && (
                    <>
                      {/* 图片导航按钮 */}
                      <button
                        onClick={() => prevImage(images)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => nextImage(images)}
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
              );
            })()}
            
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
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleEditItem(selectedItem)}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  编辑物品
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteItem(selectedItem.id, selectedItem.title)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  删除物品
                </Button>
              </div>
              <Button variant="primary" onClick={() => setSelectedItem(null)}>
                关闭
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

      {/* 图片查看器 */}
      {selectedItem && (
        <ImageViewer
          images={getImages(selectedItem)}
          currentIndex={currentImageIndex}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          onIndexChange={setCurrentImageIndex}
          title={selectedItem.title}
        />
      )}
    </>
  );
};

export default MyItemsModal; 