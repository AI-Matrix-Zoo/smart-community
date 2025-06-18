// 图片URL工具函数

// 获取API基础URL
const getApiBaseUrl = (): string => {
  // 在开发环境中，使用localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // 生产环境使用相对路径
  return '';
};

/**
 * 构建完整的图片URL
 * @param imagePath 图片路径（可能是相对路径或完整URL）
 * @returns 完整的图片URL
 */
export const buildImageUrl = (imagePath: string): string => {
  // 如果已经是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 如果是相对路径，构建完整URL
  const baseUrl = getApiBaseUrl();
  
  // 确保路径以/开头
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * 构建图片数组的完整URL
 * @param images 图片路径数组
 * @returns 完整URL数组
 */
export const buildImageUrls = (images: string[]): string[] => {
  return images.map(buildImageUrl);
};

/**
 * 从MarketItem获取图片URL数组
 * @param item 市场物品对象
 * @returns 完整的图片URL数组
 */
export const getItemImages = (item: { imageUrls?: string[]; imageUrl?: string }): string[] => {
  // 优先使用imageUrls，回退到imageUrl
  const images = item.imageUrls && item.imageUrls.length > 0 
    ? item.imageUrls 
    : [item.imageUrl].filter((url): url is string => Boolean(url));
  
  return buildImageUrls(images);
};

/**
 * 检查图片是否可以加载
 * @param imageUrl 图片URL
 * @returns Promise<boolean> 是否可以加载
 */
export const checkImageLoad = (imageUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};

/**
 * 预加载图片
 * @param imageUrls 图片URL数组
 * @returns Promise<void>
 */
export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  const promises = imageUrls.map(url => checkImageLoad(url));
  await Promise.all(promises);
}; 