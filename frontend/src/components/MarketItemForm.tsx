
import React, { useState, useEffect, useContext } from 'react';
import { MarketItem } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { Button, Input, Textarea, Select, Modal } from './UIElements';

interface MarketItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Omit<MarketItem, 'id' | 'postedDate'>) => void;
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

const MarketItemForm: React.FC<MarketItemFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const auth = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState(marketCategories[0].value);
  const [seller, setSeller] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  useEffect(() => {
    if (isOpen) {
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
      setImagePreview(null);
      setSelectedFile(null);
      const fileInput = document.getElementById('item-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isOpen, auth?.currentUser]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || price === '' || Number(price) < 0 || !seller.trim()) {
      alert('请填写物品名称、描述、价格和您的称呼！');
      return;
    }
    if (!imagePreview || !selectedFile) {
        alert('请选择一张物品图片！');
        return;
    }
    onSubmit({ 
      title, 
      description, 
      price: Number(price), 
      category, 
      seller, // This will be pre-filled if user is logged in
      sellerUserId: auth?.currentUser?.id,
      contactInfo: contactInfo.trim() ? contactInfo.trim() : undefined,
      imageUrl: imagePreview 
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="发布闲置物品" size="lg">
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
          <label htmlFor="item-image" className="block text-sm font-medium text-slate-700 mb-1">物品图片 <span className="text-red-500">*</span></label>
          <input
            type="file"
            id="item-image"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary cursor-pointer"
            required
          />
          {imagePreview && (
            <div className="mt-4 border border-slate-200 rounded-lg p-2">
              <img src={imagePreview} alt="物品预览" className="w-full max-h-48 object-contain rounded-md" />
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
          <Button type="submit" variant="secondary">确认发布</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MarketItemForm;
