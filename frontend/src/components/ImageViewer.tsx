import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

// 自定义左右箭头图标组件
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  title?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  title
}) => {
  const [imageIndex, setImageIndex] = useState(currentIndex);

  useEffect(() => {
    setImageIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      // 禁用背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 恢复背景滚动
      document.body.style.overflow = 'unset';
    }

    // 清理函数
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePrevImage = () => {
    const newIndex = (imageIndex - 1 + images.length) % images.length;
    setImageIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const handleNextImage = () => {
    const newIndex = (imageIndex + 1) % images.length;
    setImageIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
        title="关闭 (ESC)"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* 图片标题 */}
      {title && (
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}

      {/* 图片计数 */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
          {imageIndex + 1} / {images.length}
        </div>
      )}

      {/* 主图片 */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={images[imageIndex]}
          alt={`图片 ${imageIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        {/* 左右导航按钮 */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-opacity"
              title="上一张 (←)"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-opacity"
              title="下一张 (→)"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* 底部缩略图导航 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setImageIndex(index);
                onIndexChange?.(index);
              }}
              className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                index === imageIndex
                  ? 'border-white shadow-lg'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 使用提示 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-lg">
        <div>点击图片外区域或按 ESC 关闭</div>
        {images.length > 1 && <div>使用 ← → 键或点击按钮切换图片</div>}
      </div>
    </div>
  );
};

export default ImageViewer; 