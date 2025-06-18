import React, { useState, useCallback, useEffect, useContext } from 'react';
import { MarketItem } from '../types';
import { Button, Modal, Textarea } from './UIElements';
import { HandThumbUpIcon, ChatBubbleLeftIcon } from './Icons';
import ShareButton from './ShareButton';
import ImageViewer from './ImageViewer';
import { AuthContext } from '../contexts/AuthContext';
import { getItemImages } from '../utils/imageUtils';

interface MarketItemCardProps {
  item: MarketItem;
  onAddComment: (id: string, content: string) => void;
  onToggleLike: (id: string) => void;
  onEditItem?: (item: MarketItem) => void;
}

const MarketItemCard: React.FC<MarketItemCardProps> = ({ 
  item, 
  onAddComment, 
  onToggleLike, 
  onEditItem 
}) => {
  // 使用item.id作为组件的唯一标识符，确保状态完全独立
  const [expanded, setExpanded] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  const auth = useContext(AuthContext);

  // 获取图片数组，使用工具函数构建完整URL
  const images = getItemImages(item);

  // 检查当前用户是否是物品的发布者
  const isOwner = auth?.currentUser && (
    auth.currentUser.id === item.sellerUserId || 
    auth.currentUser.email === item.sellerUserId
  );

  // 确保组件在item.id变化时重置所有状态
  useEffect(() => {
    console.log(`[MarketItemCard] 组件挂载/更新 - 物品ID: ${item.id}`);
    setExpanded(false);
    setShowCommentModal(false);
    setCommentText('');
    setCurrentImageIndex(0);
    setShowImageViewer(false);
  }, [item.id]);

  // 处理展开/收起状态切换
  const handleToggleExpanded = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`[MarketItemCard] 切换展开状态 - 物品ID: ${item.id}, 当前状态: ${expanded}`);
    setExpanded(prev => {
      const newState = !prev;
      console.log(`[MarketItemCard] 新状态: ${newState} - 物品ID: ${item.id}`);
      return newState;
    });
  }, [item.id, expanded]);

  const handleCommentSubmit = useCallback(() => {
    if (!commentText.trim()) {
      alert("请输入评论内容。");
      return;
    }
    onAddComment(item.id, commentText);
    setShowCommentModal(false);
    setCommentText('');
  }, [item.id, commentText, onAddComment]);

  const handleLikeClick = useCallback(() => {
    if (!auth?.currentUser) {
      window.location.href = '/login';
      return;
    }
    onToggleLike(item.id);
  }, [item.id, auth?.currentUser, onToggleLike]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  return (
    <div 
      className="bg-white shadow-lg rounded-xl p-4 transition-shadow duration-300 hover:shadow-xl flex flex-col h-full"
      data-item-id={item.id}
    >
      {/* 图片区域 */}
      {images.length > 0 && (
        <div className="mb-4 relative">
          <img 
            src={images[currentImageIndex]} 
            alt={`${item.title} - 图片 ${currentImageIndex + 1}`} 
            className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
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

      {/* 标题和价格 */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">{item.title}</h3>
        <div className="flex justify-between items-center mb-2">
          <p className="text-2xl font-bold text-secondary">¥{item.price.toFixed(2)}</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {item.category}
          </span>
        </div>
      </div>
      
      {/* 描述 */}
      <div className="flex-1 mb-3">
        <p className="text-slate-700 text-sm line-clamp-3 mb-2">{item.description}</p>
        
        {/* 卖家信息 */}
        <div className="text-xs text-slate-500">
          <span>由 {item.seller}</span>
          {item.sellerVerified && (
            <span className="inline-flex items-center ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
              ✓
            </span>
          )}
          <span className="ml-2">{new Date(item.postedDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* 联系信息 - 简化显示 */}
      {item.contactInfo && (
        <div className="bg-blue-50 p-2 rounded-md mb-3">
          <p className="text-xs text-slate-700 truncate">
            <span className="font-semibold">联系:</span> {item.contactInfo}
          </p>
        </div>
      )}
      
      {/* 底部操作区 */}
      <div className="mt-auto pt-3 border-t border-slate-200">
        {/* 点赞和评论统计 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-colors ${
                item.isLikedByCurrentUser 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HandThumbUpIcon className="w-3 h-3" />
              <span>{item.likeCount || 0}</span>
            </button>
            
            <button
              onClick={handleToggleExpanded}
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ChatBubbleLeftIcon className="w-3 h-3" />
              <span>{item.comments?.length || 0}</span>
            </button>
          </div>

          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleToggleExpanded} 
            className="text-xs px-2"
          >
            {expanded ? '收起' : '详情'}
          </Button>
        </div>
      </div>

      {/* 展开的详细内容 */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {/* 评论区 */}
          {item.comments && item.comments.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2 text-sm">用户评论</h4>
              <div className="space-y-2">
                {item.comments.map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-2 rounded-md">
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <span>{comment.userName}</span>
                      {comment.userVerified && (
                        <span className="inline-flex items-center ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded" title="已认证用户">
                          ✓
                        </span>
                      )}
                      <span>- {new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!item.comments || item.comments.length === 0) && (
            <p className="text-xs text-slate-500 italic">暂无评论。</p>
          )}
          
          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-1">
            {auth?.currentUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommentModal(true)}
                className="text-xs px-2 py-1"
              >
                添加评论
              </Button>
            )}

            {/* 编辑按钮 - 仅对物品所有者显示 */}
            {isOwner && onEditItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditItem(item)}
                className="text-xs px-2 py-1 text-green-600 border-green-300 hover:bg-green-50"
              >
                编辑
              </Button>
            )}

            {/* 分享按钮 */}
            <ShareButton
              itemId={item.id}
              itemType="market"
              title={item.title}
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1"
            />

            {!auth?.currentUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/login'}
                className="text-xs px-2 py-1"
              >
                登录后评论
              </Button>
            )}
          </div>
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

      {/* 图片查看器 */}
      <ImageViewer
        images={images}
        currentIndex={currentImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
        title={item.title}
      />
    </div>
  );
};

export default MarketItemCard;
