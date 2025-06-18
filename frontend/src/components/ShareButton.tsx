import React, { useState } from 'react';
import { Button } from './UIElements';
import { ShareIcon, CheckIcon, ClipboardIcon } from './Icons';

interface ShareButtonProps {
  itemId: string;
  itemType: 'market' | 'suggestion';
  title: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  itemId,
  itemType,
  title,
  className = '',
  size = 'sm',
  variant = 'outline'
}) => {
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    if (itemType === 'market') {
      return `${baseUrl}/market/item/${itemId}`;
    } else {
      return `${baseUrl}/suggestions/${itemId}`;
    }
  };

  const handleShare = async () => {
    const shareUrl = generateShareUrl();
    
    try {
      // 尝试使用现代浏览器的剪贴板API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 降级方案：使用传统的document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopied(true);
      
      // 2秒后重置状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
    } catch (err) {
      console.error('复制链接失败:', err);
      // 如果复制失败，显示链接让用户手动复制
      const message = `分享链接：${shareUrl}\n\n请手动复制此链接`;
      alert(message);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={`${className} ${copied ? 'text-green-600 border-green-300' : ''}`}
      leftIcon={copied ? <CheckIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />}
      title={copied ? '链接已复制' : `分享${itemType === 'market' ? '物品' : '建议'}`}
    >
      {copied ? '已复制' : '分享'}
    </Button>
  );
};

export default ShareButton;
