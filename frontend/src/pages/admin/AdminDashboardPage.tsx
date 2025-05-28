import React, { useState } from 'react';
import { UsersIcon, ShoppingBagIcon, LightbulbIcon, MegaphoneIcon, ShieldCheckIcon } from '../../components/Icons';
import UserManagementTab from '../../components/admin/UserManagementTab';
import MarketManagementTab from '../../components/admin/MarketManagementTab';
import SuggestionManagementTab from '../../components/admin/SuggestionManagementTab';
import AnnouncementManagementTab from '../../components/admin/AnnouncementManagementTab';

type AdminTab = 'users' | 'market' | 'suggestions' | 'announcements';

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementTab />;
      case 'market':
        return <MarketManagementTab />;
      case 'suggestions':
        return <SuggestionManagementTab />;
      case 'announcements':
        return <AnnouncementManagementTab />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabName: AdminTab; label: string; icon: React.ReactNode}> = ({tabName, label, icon}) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm rounded-lg transition-colors duration-150 w-full text-left
                    ${activeTab === tabName 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        aria-current={activeTab === tabName ? 'page' : undefined}
    >
        {icon}
        <span>{label}</span>
    </button>
  ) // Removed semicolon from here

  return (
    <div className="space-y-8">
      <header className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-8 rounded-xl shadow-xl">
        <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-12 h-12" />
            <div>
                <h1 className="text-4xl font-bold">管理后台</h1>
                <p className="text-slate-300">平台数据与用户管理中心</p>
            </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-1/4 lg:w-1/5">
          <nav className="space-y-2 p-4 bg-white rounded-xl shadow-lg">
            <TabButton tabName="users" label="用户管理" icon={<UsersIcon className="w-5 h-5" />} />
            <TabButton tabName="market" label="闲置市场" icon={<ShoppingBagIcon className="w-5 h-5" />} />
            <TabButton tabName="suggestions" label="物业建议" icon={<LightbulbIcon className="w-5 h-5" />} />
            <TabButton tabName="announcements" label="平台公告" icon={<MegaphoneIcon className="w-5 h-5" />} />
          </nav>
        </aside>

        <section className="md:w-3/4 lg:w-4/5">
          <div className="bg-transparent rounded-xl min-h-[400px]"> {/* Added min-height for better visual */}
            {renderTabContent()}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
