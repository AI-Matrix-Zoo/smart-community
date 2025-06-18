import React, { useState, useEffect, useContext } from 'react';
import { MarketItem } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input, Textarea, Select, Modal } from './UIElements';

interface MarketItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Omit<MarketItem, 'id' | 'postedDate'>, files: File[]) => void;
  initialData?: MarketItem;
  isEditing?: boolean;
}

const marketCategories = [
  { value: '家具家电', label: '家具家电' },
  { value: '母婴用品', label: '母婴用品' },
  { value: '数码产品', label: '数码产品' },
  { value: '服饰鞋包', label: '服饰鞋包' },
  { value: '图书文具', label: '图书文具' },
  { value: '运动户外', label: '运动户外' },
  { value: '其他闲置', label: '其他闲置' },
];

const MarketItemForm: React.FC<MarketItemFormProps> = ({ isOpen, onClose, onSubmit, initialData, isEditing }) => {
  const auth = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState(marketCategories[0].value);
  const [seller, setSeller] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        // 编辑模式：填充现有数据
        setTitle(initialData.title);
        setDescription(initialData.description);
        setPrice(initialData.price);
        setCategory(initialData.category);
        setSeller(initialData.seller);
        setContactInfo(initialData.contactInfo || '');
        
        // 处理现有图片
        const existingImages = initialData.imageUrls && initialData.imageUrls.length > 0 
          ? initialData.imageUrls 
          : [initialData.imageUrl].filter(Boolean);
        setImagePreviews(existingImages);
        setSelectedFiles([]); // 编辑模式下，现有图片不作为文件处理
      } else {
        // 新建模式：清空所有字段
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory(marketCategories[0].value);
        if (auth?.currentUser) {
          setSeller(auth.currentUser.name);
        } else {
          setSeller('');
        }
        setContactInfo('');
        setImagePreviews([]);
        setSelectedFiles([]);
      }
      
      // 清空文件输入
      const fileInput = document.getElementById('item-images') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isOpen, auth?.currentUser, isEditing, initialData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }
    
    // 计算当前已有图片数量加上新选择的图片数量
    const totalFiles = selectedFiles.length + files.length;
    
    // 检查是否超过限制
    if (totalFiles > 5) {
      const remaining = 5 - selectedFiles.length;
      if (remaining <= 0) {
        alert('已达到最大图片数量限制（5张）！请先删除一些图片再添加新的。');
        return;
      } else {
        alert(`最多只能上传5张图片！您还可以添加${remaining}张图片。`);
        return;
      }
    }
    
    // 验证文件类型和大小
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach((file) => {
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}：不支持的文件格式`);
        return;
      }
      
      // 检查文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name}：文件大小超过5MB`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // 显示无效文件的错误信息
    if (invalidFiles.length > 0) {
      alert('以下文件无法上传：\n' + invalidFiles.join('\n'));
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    // 合并现有文件和新文件
    const newSelectedFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newSelectedFiles);
    
    // 生成新图片的预览
    const newPreviews: string[] = [...imagePreviews];
    let loadedCount = 0;
    
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[selectedFiles.length + index] = reader.result as string;
        loadedCount++;
        
        if (loadedCount === validFiles.length) {
          setImagePreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // 清空文件输入，允许重复选择相同文件
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    
    // 不需要重置文件输入，因为我们现在支持追加选择
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 添加详细的调试信息
    console.log('=== 表单提交调试信息 ===');
    console.log('isEditing:', isEditing);
    console.log('title:', title);
    console.log('description:', description);
    console.log('price:', price);
    console.log('seller:', seller);
    console.log('selectedFiles:', selectedFiles);
    console.log('selectedFiles.length:', selectedFiles.length);
    console.log('imagePreviews.length:', imagePreviews.length);
    
    if (!title.trim() || !description.trim() || price === '' || Number(price) < 0 || !seller.trim()) {
      console.log('基础字段验证失败');
      alert('请填写物品名称、描述、价格和您的称呼！');
      return;
    }
    
    // 编辑模式下，如果有现有图片预览，则不强制要求新文件
    if (!isEditing && selectedFiles.length === 0) {
      console.log('新建模式 - 文件验证失败');
      alert('请至少选择一张物品图片！');
      return;
    }
    
    if (isEditing && selectedFiles.length === 0 && imagePreviews.length === 0) {
      console.log('编辑模式 - 没有任何图片');
      alert('请至少保留一张物品图片！');
      return;
    }
    
    console.log('所有验证通过，准备提交');
    
    onSubmit({ 
      title, 
      description, 
      price: Number(price), 
      category, 
      seller,
      sellerUserId: auth?.currentUser?.id,
      contactInfo: contactInfo.trim() ? contactInfo.trim() : undefined,
      imageUrl: '', // 将由后端设置
      imageUrls: [] // 将由后端设置
    }, selectedFiles); // 传递文件数组
    
    console.log('onSubmit已调用');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "编辑闲置物品" : "发布闲置物品"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="物品名称"
          id="item-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：九成新吸尘器"
          required
        />
        <Textarea
          label="详细描述"
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请详细描述物品状况、品牌、规格等..."
          required
        />
        <Input
          label="价格 (元)"
          id="item-price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
          placeholder="例如：150"
          min="0"
          step="0.01"
          required
        />
        <Select
          label="物品类别"
          id="item-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={marketCategories}
          required
        />
        <div>
          <label htmlFor="item-images" className="block text-sm font-medium text-slate-700 mb-1">
            物品图片 <span className="text-red-500">*</span>
            <span className="text-xs text-slate-500 ml-2">(最多5张，支持JPG、PNG、GIF、WebP格式)</span>
          </label>
          <input
            type="file"
            id="item-images"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary cursor-pointer border border-slate-300 rounded-md p-2"
            multiple
          />
          
          {/* 图片预览区域 */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                图片预览 ({imagePreviews.length}/5)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group border-2 border-slate-200 rounded-lg p-2 hover:border-blue-300 transition-colors">
                    <img 
                      src={preview} 
                      alt={`物品预览 ${index + 1}`} 
                      className="w-full h-24 sm:h-32 object-cover rounded-md" 
                    />
                    
                    {/* 删除按钮 */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                      title="删除图片"
                    >
                      ×
                    </button>
                    
                    {/* 主图标识 */}
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm">
                        主图
                      </div>
                    )}
                    
                    {/* 图片序号 */}
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* 添加更多图片的占位符 */}
                {imagePreviews.length < 5 && (
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-lg p-2 h-24 sm:h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => document.getElementById('item-images')?.click()}
                  >
                    <div className="text-slate-400 text-2xl mb-1">+</div>
                    <div className="text-xs text-slate-500 text-center">
                      添加图片<br/>
                      ({5 - imagePreviews.length}张剩余)
                    </div>
                  </div>
                )}
              </div>
              
              {/* 图片上传提示 */}
              <div className="mt-2 text-xs text-slate-500">
                <p>💡 提示：</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>第一张图片将作为主图显示</li>
                  <li>可以点击删除按钮移除不需要的图片</li>
                  <li>支持拖拽选择多张图片</li>
                  <li>每张图片最大5MB</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* 无图片时的提示 */}
          {imagePreviews.length === 0 && (
            <div className="mt-2 p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
              <div className="text-slate-400 text-3xl mb-2">📷</div>
              <p className="text-sm text-slate-600 mb-1">点击上方按钮选择图片</p>
              <p className="text-xs text-slate-500">支持选择多张图片，最多5张</p>
            </div>
          )}
        </div>
        <Input
          label="您的称呼与房号"
          id="item-seller"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          placeholder="例如：陈女士 (2栋501)"
          required
          readOnly={!!auth?.currentUser}
          className={!!auth?.currentUser ? 'bg-slate-100 cursor-not-allowed' : ''}
        />
         <Input
          label="联系方式 (选填)"
          id="item-contact"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="例如：微信 xxx / 电话 138xxxxxxxx"
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" variant="secondary">{isEditing ? "保存修改" : "确认发布"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MarketItemForm;
