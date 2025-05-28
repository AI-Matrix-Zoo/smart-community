import { Suggestion, SuggestionStatus, MarketItem, SuggestionProgressUpdate, User, UserRole, Announcement } from '../types';

const SUGGESTIONS_KEY = 'community_suggestions';
const MARKET_ITEMS_KEY = 'community_market_items';
const CURRENT_USER_KEY = 'community_current_user';
const ANNOUNCEMENTS_KEY = 'community_announcements';
const ALL_USERS_KEY = 'community_all_users'; // Key for storing all users

// --- Mock Users ---
// Note: Passwords should not be stored in plaintext in a real application.
// For PROPERTY and ADMIN, building/room are not strictly necessary.
const initialUsers: User[] = [
  { id: 'user1', phone: '13800138000', password: 'password123', name: '张三 (1栋-101)', role: UserRole.USER, building: '1栋', room: '101' },
  { id: 'user2', phone: '13900139000', password: 'password123', name: '李四 (2栋-202)', role: UserRole.USER, building: '2栋', room: '202'  },
  { id: 'prop1', phone: 'property_phone_01', password: 'property123', name: '物业小王', role: UserRole.PROPERTY },
  { id: 'admin1', phone: 'admin_phone_01', password: 'admin123', name: '管理员小赵', role: UserRole.ADMIN },
  { id: 'admin2', phone: 'admin', password: 'admin', name: '超级管理员', role: UserRole.ADMIN }, // Added for easier testing
];

// Helper to get from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

// Helper to set to localStorage
const setToStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};

// --- User Management ---
const getUsers = (): User[] => {
  const users = getFromStorage<User[] | null>(ALL_USERS_KEY, null);
  if (users === null || users.length === 0) { // Ensure initial users are set if empty or null
    setToStorage(ALL_USERS_KEY, initialUsers);
    return initialUsers;
  }
  // Ensure there's always an admin user for safety (e.g. if localStorage was cleared or manually tampered)
  if (!users.some(u => u.role === UserRole.ADMIN)) {
    const adminUser = initialUsers.find(u => u.role === UserRole.ADMIN);
    if (adminUser && !users.find(u => u.id === adminUser.id)) {
        users.push(adminUser);
        setToStorage(ALL_USERS_KEY, users);
    } else if (!adminUser) { // if initialUsers somehow doesn't have an admin
        const defaultAdmin = { id: 'admin_fallback', phone: 'admin_fallback', password: 'admin', name: 'Fallback Admin', role: UserRole.ADMIN };
        users.push(defaultAdmin);
        setToStorage(ALL_USERS_KEY, users);
    }
  }
  return users;
};

const saveUsers = (users: User[]): void => {
  setToStorage(ALL_USERS_KEY, users);
};


// --- Auth API ---
export const loginUser = (phoneInput: string, passwordInput: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => { // Simulate API delay
      const users = getUsers();
      const user = users.find(u => u.phone === phoneInput && u.password === passwordInput);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        setToStorage(CURRENT_USER_KEY, userWithoutPassword);
        resolve(userWithoutPassword);
      } else {
        resolve(null);
      }
    }, 500);
  });
};

export interface RegistrationData {
  phone: string;
  password?: string; 
  name: string; 
  building: string;
  room: string;
}

export const registerUser = (data: RegistrationData): Promise<{ success: boolean; message?: string; user?: User | null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let users = getUsers();
      if (users.find(u => u.phone === data.phone)) {
        resolve({ success: false, message: '该手机号已被注册。' });
        return;
      }

      const newUser: User = {
        id: `user${Date.now()}`,
        phone: data.phone,
        password: data.password,
        name: `${data.name} (${data.building}-${data.room})`,
        role: UserRole.USER,
        building: data.building,
        room: data.room,
      };
      
      users.push(newUser);
      saveUsers(users);
      
      const { password, ...userWithoutPassword } = newUser;
      resolve({ success: true, user: userWithoutPassword });
    }, 500);
  });
};


export const logoutUser = (): Promise<void> => {
  window.localStorage.removeItem(CURRENT_USER_KEY);
  return Promise.resolve();
};

export const getCurrentUser = (): User | null => {
  return getFromStorage<User | null>(CURRENT_USER_KEY, null);
};


// Initial mock data
const initialSuggestions: Suggestion[] = [
  {
    id: 's1',
    title: '修复1号楼电梯异响',
    description: '1号楼的电梯最近运行时有奇怪的响声，希望能尽快检查维修。',
    category: '公共维修',
    submittedBy: '张三 (1栋-101)',
    submittedByUserId: 'user1', 
    submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: SuggestionStatus.Submitted,
    progressUpdates: [],
  },
  {
    id: 's2',
    title: '增加小区内宠物活动区域',
    description: '建议在小区花园旁开辟一小块区域供宠物活动，并设置相关设施。',
    category: '环境绿化',
    submittedBy: '李四 (2栋-202)',
    submittedByUserId: 'user2',
    submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: SuggestionStatus.InProgress,
    progressUpdates: [
      { update: '物业已收到建议，正在评估可行性。', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), by: '物业系统', byRole: UserRole.PROPERTY }
    ],
  },
];

const initialMarketItems: MarketItem[] = [
  {
    id: 'm1',
    title: '九成新婴儿床',
    description: '宝宝长大了用不上了，实木婴儿床，几乎全新，带床垫。',
    price: 300,
    category: '母婴用品',
    imageUrl: 'https://picsum.photos/seed/m1/400/300',
    seller: '业主赵 (非特定用户)', 
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    contactInfo: '微信: zhaoliu123'
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'anno1',
    content: '近期将组织小区消防演练，请各位业主关注后续通知，积极参与。',
    authorId: 'admin1',
    authorName: '管理员小赵',
    roleOfAuthor: UserRole.ADMIN,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


// Suggestions API
export const getSuggestions = (): Promise<Suggestion[]> => {
  return Promise.resolve(getFromStorage(SUGGESTIONS_KEY, initialSuggestions).sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));
};

export const addSuggestion = (suggestionData: Omit<Suggestion, 'id' | 'submittedDate' | 'status' | 'progressUpdates'>): Promise<Suggestion> => {
  const suggestions = getFromStorage(SUGGESTIONS_KEY, initialSuggestions);
  const currentUser = getCurrentUser();
  const newSuggestion: Suggestion = {
    ...suggestionData,
    id: `s${Date.now()}`,
    submittedDate: new Date().toISOString(),
    status: SuggestionStatus.Submitted,
    progressUpdates: [],
    submittedByUserId: currentUser?.id,
    submittedBy: currentUser?.name || suggestionData.submittedBy,
  };
  const updatedSuggestions = [newSuggestion, ...suggestions];
  setToStorage(SUGGESTIONS_KEY, updatedSuggestions);
  return Promise.resolve(newSuggestion);
};

export const updateSuggestionStatus = (id: string, status: SuggestionStatus, progressUpdateText: string): Promise<Suggestion | null> => {
  let suggestions = getFromStorage(SUGGESTIONS_KEY, initialSuggestions);
  const index = suggestions.findIndex(s => s.id === id);
  if (index !== -1) {
    const currentUser = getCurrentUser();
    suggestions[index].status = status;
    const update: SuggestionProgressUpdate = {
        update: progressUpdateText,
        date: new Date().toISOString(),
        by: currentUser?.name || '物业系统',
        byRole: currentUser?.role || UserRole.PROPERTY,
    };
    suggestions[index].progressUpdates.push(update);
    setToStorage(SUGGESTIONS_KEY, suggestions);
    return Promise.resolve(suggestions[index]);
  }
  return Promise.resolve(null);
};

export const addSuggestionProgress = (id: string, updateText: string): Promise<Suggestion | null> => {
  let suggestions = getFromStorage(SUGGESTIONS_KEY, initialSuggestions);
  const index = suggestions.findIndex(s => s.id === id);
  if (index !== -1) {
    const currentUser = getCurrentUser();
    const newProgressUpdate: SuggestionProgressUpdate = {
      update: updateText,
      date: new Date().toISOString(),
      by: currentUser?.name || '物业系统',
      byRole: currentUser?.role || UserRole.PROPERTY,
    };
    suggestions[index].progressUpdates.push(newProgressUpdate);
    setToStorage(SUGGESTIONS_KEY, suggestions);
    return Promise.resolve(suggestions[index]);
  }
  return Promise.resolve(null);
};


// Market Items API
export const getMarketItems = (): Promise<MarketItem[]> => {
  return Promise.resolve(getFromStorage(MARKET_ITEMS_KEY, initialMarketItems).sort((a,b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
};

export const addMarketItem = (itemData: Omit<MarketItem, 'id' | 'postedDate'>): Promise<MarketItem> => {
  const items = getFromStorage(MARKET_ITEMS_KEY, initialMarketItems);
  const currentUser = getCurrentUser();
  const newItem: MarketItem = {
    ...itemData,
    id: `m${Date.now()}`,
    postedDate: new Date().toISOString(),
    sellerUserId: currentUser?.id,
    seller: currentUser?.name || itemData.seller,
  };
  const updatedItems = [newItem, ...items];
  setToStorage(MARKET_ITEMS_KEY, updatedItems);
  return Promise.resolve(newItem);
};

// Announcements API
export const getAnnouncements = (): Promise<Announcement[]> => {
  return Promise.resolve(getFromStorage(ANNOUNCEMENTS_KEY, initialAnnouncements).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
};

export const addAnnouncement = (content: string): Promise<Announcement | null> => {
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROPERTY)) {
    console.warn('User does not have permission to add announcements.');
    return Promise.resolve(null);
  }
  const announcements = getFromStorage(ANNOUNCEMENTS_KEY, initialAnnouncements);
  const now = new Date().toISOString();
  const newAnnouncement: Announcement = {
    id: `anno${Date.now()}`,
    content,
    authorId: currentUser.id,
    authorName: currentUser.name,
    roleOfAuthor: currentUser.role,
    createdAt: now,
    updatedAt: now,
  };
  const updatedAnnouncements = [newAnnouncement, ...announcements];
  setToStorage(ANNOUNCEMENTS_KEY, updatedAnnouncements);
  return Promise.resolve(newAnnouncement);
};

export const updateAnnouncement = (id: string, newContent: string): Promise<Announcement | null> => {
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROPERTY)) {
    console.warn('User does not have permission to update announcements.');
    return Promise.resolve(null);
  }
  let announcements = getFromStorage(ANNOUNCEMENTS_KEY, initialAnnouncements);
  const index = announcements.findIndex(a => a.id === id);
  if (index !== -1) {
    announcements[index].content = newContent;
    announcements[index].updatedAt = new Date().toISOString();
    setToStorage(ANNOUNCEMENTS_KEY, announcements);
    return Promise.resolve(announcements[index]);
  }
  return Promise.resolve(null);
};

export const deleteAnnouncement = (id: string): Promise<boolean> => {
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROPERTY)) {
    console.warn('User does not have permission to delete announcements.');
    return Promise.resolve(false);
  }
  let announcements = getFromStorage(ANNOUNCEMENTS_KEY, initialAnnouncements);
  const updatedAnnouncements = announcements.filter(a => a.id !== id);
  if (announcements.length !== updatedAnnouncements.length) {
    setToStorage(ANNOUNCEMENTS_KEY, updatedAnnouncements);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};

// --- Admin Specific Functions ---
export const adminGetAllUsers = (): Promise<User[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    console.warn('Admin action: Unauthorized attempt to get all users.');
    return Promise.resolve([]);
  }
  // Return users without their passwords
  const allUsers = getUsers();
  return Promise.resolve(allUsers.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  }));
};

export const adminUpdateUser = (userId: string, userData: Partial<Pick<User, 'name' | 'phone' | 'role' | 'building' | 'room'>>): Promise<User | null> => {
  const currentAdmin = getCurrentUser();
  if (!currentAdmin || currentAdmin.role !== UserRole.ADMIN) {
    console.warn('Admin action: Unauthorized attempt to update user.');
    return Promise.resolve(null);
  }
  
  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return Promise.resolve(null); // User not found
  }

  // Prevent admin from changing their own role if they are the only admin
  if (users[userIndex].id === currentAdmin.id && userData.role && userData.role !== UserRole.ADMIN) {
      const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
      if (adminCount <= 1) {
          console.warn("Admin action: Cannot change the role of the last admin.");
          alert("无法更改最后一个管理员的角色。"); // Or throw an error
          // To prevent the change, we can just return the current user state or null
          const { password, ...userWithoutPassword } = users[userIndex];
          return Promise.resolve(userWithoutPassword);
      }
  }


  // Update user data. Password should not be updated here.
  users[userIndex] = { ...users[userIndex], ...userData };
  saveUsers(users);
  
  // If the updated user is the currently logged-in admin, update their details in current_user_key
  if (users[userIndex].id === currentAdmin.id) {
    const { password, ...updatedAdminWithoutPassword } = users[userIndex];
    setToStorage(CURRENT_USER_KEY, updatedAdminWithoutPassword);
  }

  const { password, ...userWithoutPassword } = users[userIndex];
  return Promise.resolve(userWithoutPassword);
};

export const adminDeleteUser = (userId: string): Promise<boolean> => {
  const currentAdmin = getCurrentUser();
  if (!currentAdmin || currentAdmin.role !== UserRole.ADMIN) {
    console.warn('Admin action: Unauthorized attempt to delete user.');
    return Promise.resolve(false);
  }
  if (userId === currentAdmin.id) {
    console.warn('Admin action: Admin cannot delete themselves.');
    alert("管理员不能删除自己。");
    return Promise.resolve(false);
  }

  let users = getUsers();
  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);
  
  if (users.length < initialLength) {
    saveUsers(users);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};


export const adminDeleteMarketItem = (itemId: string): Promise<boolean> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    console.warn('Admin action: Unauthorized attempt to delete market item.');
    return Promise.resolve(false);
  }
  let items = getFromStorage(MARKET_ITEMS_KEY, initialMarketItems);
  const updatedItems = items.filter(item => item.id !== itemId);
  if (items.length !== updatedItems.length) {
    setToStorage(MARKET_ITEMS_KEY, updatedItems);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};

export const adminDeleteSuggestion = (suggestionId: string): Promise<boolean> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    console.warn('Admin action: Unauthorized attempt to delete suggestion.');
    return Promise.resolve(false);
  }
  let suggestions = getFromStorage(SUGGESTIONS_KEY, initialSuggestions);
  const updatedSuggestions = suggestions.filter(s => s.id !== suggestionId);
  if (suggestions.length !== updatedSuggestions.length) {
    setToStorage(SUGGESTIONS_KEY, updatedSuggestions);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};


// Ensure getUsers is called at least once to initialize localStorage if empty
getUsers();
// Check initial data for other stores
if (getFromStorage(SUGGESTIONS_KEY, null) === null) {
  setToStorage(SUGGESTIONS_KEY, initialSuggestions);
}
if (getFromStorage(MARKET_ITEMS_KEY, null) === null) {
  setToStorage(MARKET_ITEMS_KEY, initialMarketItems);
}
if (getFromStorage(ANNOUNCEMENTS_KEY, null) === null) {
  setToStorage(ANNOUNCEMENTS_KEY, initialAnnouncements);
}