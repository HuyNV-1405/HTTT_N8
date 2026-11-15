import React, { useState, useEffect } from 'react';
import api from './api/client';
import { 
  User, 
  Product, 
  LoaiHang, 
  NhaCungCap, 
  KhachHang, 
  Kho, 
  ViTriLuuTru, 
  TonKhoItem, 
  Receipt, 
  Dispatch, 
  CanhBao, 
  DashboardStats 
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { ReceiptsView } from './components/ReceiptsView';
import { DispatchesView } from './components/DispatchesView';
import { TransfersView } from './components/TransfersView';
import { InventoryView } from './components/InventoryView';
import { AlertsView } from './components/AlertsView';
import { AuditsView } from './components/AuditsView';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<LoaiHang[]>([]);
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [warehouses, setWarehouses] = useState<Kho[]>([]);
  const [locations, setLocations] = useState<ViTriLuuTru[]>([]);
  const [inventory, setInventory] = useState<TonKhoItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<CanhBao[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Check token & fetch initial public data
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('wms_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setCurrentUser(res.data.data);
        } catch (e) {
          localStorage.removeItem('wms_token');
          // Auto login as default admin for seamless initial preview
          handleLogin('admin', 'Admin@123');
        }
      } else {
        // Auto login as demo admin on first launch
        handleLogin('admin', 'Admin@123');
      }
    };
    initAuth();
  }, []);

  // 2. Fetch full data when authenticated
  const fetchAllData = async () => {
    try {
      const [
        dashboardRes,
        prodRes,
        catRes,
        supRes,
        custRes,
        whRes,
        locRes,
        invRes,
        recRes,
        dispRes,
        transRes,
        alertRes,
      ] = await Promise.all([
        api.get('/inventory/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/products/categories').catch(() => ({ data: { data: [] } })),
        api.get('/products/suppliers').catch(() => ({ data: { data: [] } })),
        api.get('/products/customers').catch(() => ({ data: { data: [] } })),
        api.get('/locations/warehouses').catch(() => ({ data: { data: [] } })),
        api.get('/locations').catch(() => ({ data: { data: [] } })),
        api.get('/inventory').catch(() => ({ data: { data: [] } })),
        api.get('/receipts').catch(() => ({ data: { data: [] } })),
        api.get('/dispatches').catch(() => ({ data: { data: [] } })),
        api.get('/transfers').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/alerts').catch(() => ({ data: { data: [] } })),
      ]);

      if (dashboardRes.data.data) setStats(dashboardRes.data.data);
      if (prodRes.data.data) setProducts(prodRes.data.data);
      if (catRes.data.data) setCategories(catRes.data.data);
      if (supRes.data.data) setSuppliers(supRes.data.data);
      if (custRes.data.data) setCustomers(custRes.data.data);
      if (whRes.data.data) setWarehouses(whRes.data.data);
      if (locRes.data.data) setLocations(locRes.data.data);
      if (invRes.data.data) setInventory(invRes.data.data);
      if (recRes.data.data) setReceipts(recRes.data.data);
      if (dispRes.data.data) setDispatches(dispRes.data.data);
      if (transRes.data.data) setTransfers(transRes.data.data);
      if (alertRes.data.data) setAlerts(alertRes.data.data);

      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'QUAN_LY_KHO') {
        const auditRes = await api.get('/inventory/audits').catch(() => ({ data: { data: [] } }));
        if (auditRes.data.data) setAudits(auditRes.data.data);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  // Auth actions
  const handleLogin = async (username: string, pass: string) => {
    const res = await api.post('/auth/login', { username, password: pass });
    localStorage.setItem('wms_token', res.data.data.token);
    setCurrentUser(res.data.data.user);
    showToast(`Đăng nhập thành công với vai trò: ${res.data.data.user.role}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('wms_token');
    setCurrentUser(null);
    showToast('Đã đăng xuất tài khoản');
  };

  // Product actions
  const handleAddProduct = async (data: any) => {
    await api.post('/products', data);
    showToast('Đã thêm sản phẩm mới thành công');
    fetchAllData();
  };

  // Receipt actions
  const handleCreateReceipt = async (data: any) => {
    await api.post('/receipts', data);
    showToast('Đã lập phiếu nhập kho mới (Chờ duyệt)');
    fetchAllData();
  };

  const handleApproveReceipt = async (id: string) => {
    await api.post(`/receipts/${id}/approve`);
    showToast('Đã phê duyệt và cộng tồn kho thành công (Transaction Completed)!');
    fetchAllData();
  };

  const handleRejectReceipt = async (id: string, lyDo?: string) => {
    await api.post(`/receipts/${id}/reject`, { lyDo });
    showToast('Đã từ chối phiếu nhập kho');
    fetchAllData();
  };

  // Dispatch actions
  const handleCreateDispatch = async (data: any) => {
    await api.post('/dispatches', data);
    showToast('Đã lập phiếu xuất kho mới (Tạm giữ tồn khả dụng)');
    fetchAllData();
  };

  const handleApproveDispatch = async (id: string) => {
    await api.post(`/dispatches/${id}/approve`);
    showToast('Đã phê duyệt và trừ tồn kho thành công (Transaction Completed)!');
    fetchAllData();
  };

  const handleRejectDispatch = async (id: string, lyDo?: string) => {
    await api.post(`/dispatches/${id}/reject`, { lyDo });
    showToast('Đã từ chối phiếu xuất và hoàn trả tồn khả dụng');
    fetchAllData();
  };

  // Transfer actions
  const handleCreateTransfer = async (data: any) => {
    await api.post('/transfers', data);
    showToast('Đã lập yêu cầu điều chuyển kho');
    fetchAllData();
  };

  const handleApproveTransfer = async (id: string) => {
    await api.post(`/transfers/${id}/approve`);
    showToast('Đã hoàn tất điều chuyển (Trừ nguồn & Cộng đích)!');
    fetchAllData();
  };

  // Alert actions
  const handleResolveAlert = async (id: string) => {
    await api.post(`/inventory/alerts/${id}/resolve`);
    showToast('Đã đánh dấu xử lý cảnh báo tồn kho');
    fetchAllData();
  };

  // Stock Adjustment action
  const handleAdjustStock = async (data: {
    hangHoaId: string;
    viTriId?: string;
    khoId?: string;
    soLuongMoi: number;
    lyDo: string;
    dieuChinhTongTon?: boolean;
  }) => {
    await api.post('/inventory/adjust', data);
    showToast('Đã điều chỉnh tồn kho thành công (Ghi nhận sổ kho & Audit Log)!');
    fetchAllData();
  };

  const canApprove = currentUser?.role === 'ADMIN' || currentUser?.role === 'QUAN_LY_KHO';
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'QUAN_LY_KHO' || currentUser?.role === 'NHAN_VIEN_MUA_HANG';
  const activeAlertsCount = alerts.filter((a) => a.trangThai === 'CHUA_XU_LY').length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-bold transition-all animate-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={currentUser?.role}
        alertCount={activeAlertsCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          alertCount={activeAlertsCount}
          onAlertClick={() => setCurrentTab('alerts')}
        />

        <main className="p-6 max-w-7xl mx-auto w-full flex-1">
          {currentTab === 'dashboard' && (
            <DashboardView stats={stats} onNavigate={setCurrentTab} />
          )}

          {currentTab === 'products' && (
            <ProductsView
              products={products}
              categories={categories}
              suppliers={suppliers}
              locations={locations}
              onAddProduct={handleAddProduct}
              onAdjustStock={handleAdjustStock}
              canManage={canManage}
            />
          )}

          {currentTab === 'receipts' && (
            <ReceiptsView
              receipts={receipts}
              products={products}
              warehouses={warehouses}
              suppliers={suppliers}
              locations={locations}
              onCreateReceipt={handleCreateReceipt}
              onApproveReceipt={handleApproveReceipt}
              onRejectReceipt={handleRejectReceipt}
              canApprove={canApprove}
            />
          )}

          {currentTab === 'dispatches' && (
            <DispatchesView
              dispatches={dispatches}
              products={products}
              warehouses={warehouses}
              customers={customers}
              locations={locations}
              onCreateDispatch={handleCreateDispatch}
              onApproveDispatch={handleApproveDispatch}
              onRejectDispatch={handleRejectDispatch}
              canApprove={canApprove}
            />
          )}

          {currentTab === 'transfers' && (
            <TransfersView
              transfers={transfers}
              warehouses={warehouses}
              products={products}
              locations={locations}
              onCreateTransfer={handleCreateTransfer}
              onApproveTransfer={handleApproveTransfer}
              canApprove={canApprove}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              warehouses={warehouses}
              locations={locations}
              inventory={inventory}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
              onNavigateToReceipt={() => setCurrentTab('receipts')}
              canManage={canApprove}
            />
          )}

          {currentTab === 'audits' && (
            <AuditsView audits={audits} />
          )}
        </main>
      </div>

      {/* Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;

