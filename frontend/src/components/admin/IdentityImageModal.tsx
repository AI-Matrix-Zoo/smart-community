import React from 'react';
import { User } from '../../types';
import { Modal } from '../UIElements';
import { PhotoIcon, PencilIcon } from '../Icons';

interface IdentityImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const IdentityImageModal: React.FC<IdentityImageModalProps> = ({ isOpen, onClose, user }) => {
  if (!user.identity_image) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="身份证明材料" size="md">
        <div className="text-center py-8">
          <PencilIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">该用户未上传身份证明材料</p>
        </div>
      </Modal>
    );
  }

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // 判断是否为图片文件
  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(getFileExtension(filename));
  };

  // 判断是否为PDF文件
  const isPdfFile = (filename: string): boolean => {
    return getFileExtension(filename) === 'pdf';
  };

  // 构建完整的文件URL
  const getFileUrl = (path: string): string => {
    // 如果路径已经是完整URL，直接返回
    if (path.startsWith('http')) {
      return path;
    }
    
    // 构建基于当前主机的URL
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `http://${window.location.hostname}:3000`;
    
    // 确保路径以/开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${normalizedPath}`;
  };

  const fileUrl = getFileUrl(user.identity_image);
  const fileName = user.identity_image.split('/').pop() || '身份证明材料';
  const fileExtension = getFileExtension(fileName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`身份证明材料 - ${user.name}`} size="lg">
      <div className="space-y-4">
        {/* 用户信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">用户姓名：</span>
              <span className="text-gray-900">{user.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">用户ID：</span>
              <span className="text-gray-900">{user.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">楼栋信息：</span>
              <span className="text-gray-900">{user.building} {user.unit} {user.room}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">认证状态：</span>
              <span className={`${user.is_verified ? 'text-green-600' : 'text-gray-500'}`}>
                {user.is_verified ? '已认证' : '未认证'}
              </span>
            </div>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="border-b pb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isImageFile(fileName) ? (
              <PhotoIcon className="w-4 h-4" />
            ) : (
              <PencilIcon className="w-4 h-4" />
            )}
            <span>文件名：{fileName}</span>
            <span>•</span>
            <span>类型：{fileExtension.toUpperCase()}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            文件路径：{user.identity_image}
          </div>
        </div>

        {/* 文件内容显示 */}
        <div className="max-h-96 overflow-auto">
          {isImageFile(fileName) ? (
            <div className="text-center">
              <img
                src={fileUrl}
                alt={`${user.name}的身份证明材料`}
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorDiv = target.nextElementSibling as HTMLElement;
                  if (errorDiv) {
                    errorDiv.style.display = 'block';
                  }
                }}
              />
              <div className="hidden text-center py-8 text-red-500">
                <PencilIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <p>无法加载图片</p>
                <p className="text-sm text-gray-500 mt-2">
                  请检查文件是否存在或网络连接是否正常
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  文件URL: {fileUrl}
                </p>
              </div>
            </div>
          ) : isPdfFile(fileName) ? (
            <div className="text-center space-y-4">
              {/* PDF预览提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-3">
                  <PencilIcon className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">PDF文档</h3>
                <p className="text-sm text-blue-700 mb-4">
                  由于浏览器安全策略，PDF文件无法直接在此处预览。
                  <br />
                  请点击下方按钮在新窗口中查看完整文档。
                </p>
                <div className="space-y-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    在新窗口中打开PDF
                  </a>
                  <div className="text-xs text-blue-600">
                    文件大小：正在获取... | 格式：PDF
                  </div>
                </div>
              </div>
              
              {/* 尝试使用embed作为备选方案 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
                  PDF预览（如果支持）
                </div>
                <embed
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  type="application/pdf"
                  className="w-full h-64"
                  onError={() => {
                    console.log('PDF embed预览失败，这是正常现象');
                  }}
                />
                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center">
                  如果上方无法显示PDF内容，请使用"在新窗口中打开PDF"按钮
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <PencilIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">不支持预览此文件类型</p>
              <p className="text-sm text-gray-500 mb-4">
                文件类型：{fileExtension.toUpperCase()}
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                下载文件
              </a>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-500">
            {user.verified_at && (
              <span>认证时间：{new Date(user.verified_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex space-x-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              在新窗口打开
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IdentityImageModal; 