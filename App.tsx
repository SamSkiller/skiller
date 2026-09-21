import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, X, Star, Trash2, Plus, Minus, Truck, Smartphone, CheckCircle2, 
  Eye, Heart, MapPin, Lock, ArrowLeft, Loader2, Sparkles, CreditCard, 
  LogOut, Users, BarChart3, ClipboardList, Camera, History, Edit3, Globe, 
  Shield, Activity, RefreshCw, Cpu, Menu, Gem, Layers, Send, Search, ArrowUpDown, 
  ChevronRight, Key, Mail, Github, User as UserIcon, Package, TrendingUp, Settings, PieChart, ChevronDown,
  ArrowRight, CreditCard as CardIcon, Map as MapIcon, DollarSign, Briefcase, Moon, Sun, Bell, Gift, 
  Languages, Trash, Share2, ShieldAlert, Crown, Zap, Fingerprint, Cloud, MessageSquare,
  Wifi, WifiOff, Clock, Youtube,AlertCircle, Info, Terminal, Database
} from 'lucide-react';
import { PRODUCTS as INITIAL_PRODUCTS, SHIPPING_OPTIONS } from './constants';
import { Product, CartItem, Order, User, Category, Review } from './types';
import { initiateSTKPush } from './services/mpesaService';
import { generateProductCopy, getStyleTips } from './services/geminiService';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, BarChart, Bar, Cell, PieChart as RePieChart, Pie } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.MODE === 'production' 
    ? "https://faith-blst.onrender.com/api" 
    : "http://localhost:5000/api");

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=2070",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=873&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1509664158680-07c5032b51e5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fGZhc2hpb24lMjBiYWNrZ3JvdW5kfGVufDB8MHwwfHx8MA%3D%3D",
  "https://images.unsplash.com/photo-1566958799193-c2aa57a835d4?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aGlnaCUyMGhlZWxzfGVufDB8MHwwfHx8MA%3D%3D",
  "https://images.unsplash.com/photo-1658043408629-a99f0fc6bf0b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTQyfHxiaWtpbml8ZW58MHwwfDB8fHww",
  "https://images.unsplash.com/photo-1771151723402-d45f379ceaa9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fHNob3J0JTIwc2tpcnR8ZW58MHwwfDB8fHww",
  "https://images.unsplash.com/photo-1722467180322-0bd55d4d99e8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTd8fHNob3J0JTIwc2tpcnR8ZW58MHwwfDB8fHww"
];

// E-Commerce Nested Category Hierarchy 
const CATEGORY_HIERARCHY = {
  'Women': ['Dresses', 'Tops', 'Bottoms', 'Shoes'],
  'Men': ['Shirts', 'Pants', 'Suits', 'Shoes'],
  'Accessories': ['Bags', 'Jewelry', 'Watches'],
  'Hot Deals': []
};

//Cloudinary
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'faith_shop'); 
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/dqph9r4kj/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary Error:", err);
    return null;
  }
};


// --- Shared Components ---

// --- Skeleton Components ---
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${className}`}></div>
);

const ProductSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-50 dark:border-slate-800 p-5 flex flex-col min-h-[450px]">
    <Skeleton className="w-full aspect-[3/4] rounded-[40px] mb-6" />
    <div className="px-4 flex-1 flex flex-col text-center gap-3">
      <Skeleton className="w-1/3 h-3 rounded-full mx-auto" />
      <Skeleton className="w-3/4 h-6 rounded-full mx-auto mb-2" />
      <div className="mt-auto flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-6">
        <Skeleton className="w-24 h-8 rounded-full" />
        <Skeleton className="w-14 h-14 rounded-[24px]" />
      </div>
    </div>
  </div>
);

const Navbar = ({ cartCount, onOpenCart, setView, activeView, selectedCategory, setSelectedCategory, currentUser, onOpenProfile, searchQuery, setSearchQuery, products, isSynced, isDarkMode, toggleTheme }: any) => {
const [showSearch, setShowSearch] = useState(false);
  const [isAnimate, setIsAnimate] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (cartCount > 0) {
      setIsAnimate(true);
      const timer = setTimeout(() => setIsAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

const searchResults = useMemo(() => {
    if (!searchQuery || !products) return []; // Added !products check
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, products]);

  return (
    <header className="sticky top-0 z-[60] w-full">
<div className="bg-gradient-to-r from-rose-600 via-purple-600 to-rose-600 text-white py-1.5 px-4 flex items-center justify-center gap-3 text-[9px] font-mono font-bold uppercase tracking-[0.4em] animate-gradient-x relative shadow-[0_0_20px_rgba(225,29,72,0.4)] border-b border-white/20">
  {isSynced ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />}
 SKILLER SHOP Active • Same-Day  Delivery
</div>
      
      <nav className="bg-white/90 dark:bg-slate-900/90 glass border-b border-rose-100 dark:border-slate-800 px-4 md:px-12 h-20 flex items-center justify-between shadow-xl transition-colors">
<div className="flex items-center gap-4">
          <button className="lg:hidden text-slate-600 dark:text-slate-300 p-2 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
            <button 
             onClick={() => { setView('home'); setSelectedCategory('All'); }} 
            className="group flex flex-col items-start leading-none transition-transform hover:scale-105 active:scale-95"
          >
            <span className="text-xl md:text-2xl font-serif font-bold tracking-tighter text-rose-600 italic">SKILLER</span>
            <span className="text-[7px] md:text-[9px] font-black tracking-[0.4em] text-slate-400 mt-0.5 uppercase">SHOP</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">
<button onClick={() => { setView('home'); setSelectedCategory('All'); }} className={`hover:text-rose-600 font-bold transition-all ${selectedCategory === 'All' && activeView === 'home' ? 'text-rose-600 border-b-2 border-rose-600 pb-1' : 'text-slate-700 dark:text-slate-300'}`}>
            All
          </button>
          
          {Object.keys(CATEGORY_HIERARCHY).map((parentCat) => (
             <div key={parentCat} className="relative group py-4">
                <button 
                  onClick={() => { setView('home'); setSelectedCategory(parentCat); }} 
                  className={`hover:text-rose-600 font-bold transition-all ${selectedCategory.startsWith(parentCat) && activeView === 'home' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {parentCat}
                </button>
                {CATEGORY_HIERARCHY[parentCat as keyof typeof CATEGORY_HIERARCHY].length > 0 && (
                  <div className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 z-50">
                    <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col min-w-[180px] gap-1 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full"></div>
                       {CATEGORY_HIERARCHY[parentCat as keyof typeof CATEGORY_HIERARCHY].map(sub => (
                          <button 
                            key={sub} 
                            onClick={() => { setView('home'); setSelectedCategory(`${parentCat} - ${sub}`); }} 
                            className="text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-slate-800/80 rounded-xl transition-all text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600"
                          >
                            {sub}
                          </button>
                       ))}
                    </div>
                  </div>
                )}
             </div>
          ))}
          
          <div className="relative group">
            <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full transition-all border border-transparent ${showSearch ? 'w-64 border-rose-200 ring-2 ring-rose-100' : 'w-48'}`}>
              <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setView('search');
                    setShowSearch(false);
                    e.currentTarget.blur();
                  }
                }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder="Search sanctuary..." 
                className={`bg-transparent border-none outline-none font-mono text-[10px] w-full placeholder:text-slate-500 transition-colors ${searchQuery && searchResults.length === 0 ? 'text-rose-600 font-black' : 'text-slate-900 dark:text-white'}`}
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-2 border border-slate-100 dark:border-slate-700 animate-fade-in overflow-hidden">
                {searchResults.map((p: any) => (
                  <button 
                    key={p.id} 
                    onClick={() => { setView('home'); setSearchQuery(p.name); }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    <img src={p.image} className="w-8 h-10 object-cover rounded-md" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-[8px] text-rose-500 font-black">Ksh {p.price.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <button onClick={toggleTheme} className="relative p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-transform active:scale-90 hover:rotate-12 shrink-0">
            {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          
          <button onClick={onOpenCart} className={`relative p-1.5 md:p-2 text-slate-600 hover:text-rose-500 transition-all shrink-0 ${isAnimate ? 'scale-125 text-rose-600' : ''}`}>
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-black border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {!currentUser ? (
            <button onClick={() => setView('auth')} className="px-6 py-2.5 bg-slate-900 dark:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 dark:hover:bg-rose-700 transition-all shadow-lg active:scale-95">
              Login
            </button>
          ) : (
           <div className="flex items-center gap-4">
              {(currentUser.role === 'admin' || currentUser.email === 'skiller@skiller') && (
                <button 
                  onClick={() => setView('admin')}
                  className={`flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-neon hover:scale-105 transition-transform ${activeView === 'admin' ? 'ring-2 ring-white ring-offset-2 ring-offset-rose-600' : ''}`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:block">Admin Vault</span>
                </button>
              )}
              <div onClick={onOpenProfile} className="rotating-border-container cursor-pointer p-0.5 active:scale-95 shrink-0 ml-1">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-800 relative z-10 shadow-lg">
                  {currentUser.profilePic ? (
                    <img src={currentUser.profilePic} className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-conic-profile w-full h-full flex items-center justify-center text-white font-black text-lg">{currentUser.name.charAt(0)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
         <div className="fixed inset-0 z-[100] flex animate-fade-in-left lg:hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-72 bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 flex flex-col border-r border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-10">
                  <span className="text-3xl font-serif font-bold text-rose-600 italic">SKILLER</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
               </div>
               
               <div className="relative mb-8">
                 <input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && searchQuery.trim()) {
                       setView('search');
                       setIsMobileMenuOpen(false);
                       e.currentTarget.blur();
                     }
                   }}
                   placeholder="Search products..." 
                   className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-10"
                 />
                 <Search onClick={() => { if(searchQuery.trim()) { setView('search'); setIsMobileMenuOpen(false); } }} className="w-5 h-5 text-rose-500 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform" />
               </div>

               <div className="flex flex-col gap-6 flex-1">
                  <button 
                    onClick={() => { setView('home'); setSelectedCategory('All'); setIsMobileMenuOpen(false); }} 
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all shadow-sm ${selectedCategory === 'All' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-rose-300'}`}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">All Collection</span>
                  </button>

                  {Object.keys(CATEGORY_HIERARCHY).map(parentCat => (
                     <div key={parentCat} className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button 
                          onClick={() => { setView('home'); setSelectedCategory(parentCat); setIsMobileMenuOpen(false); }} 
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all shadow-sm ${selectedCategory.startsWith(parentCat) ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-rose-300'}`}
                        >
                          <span className="text-sm font-black uppercase tracking-widest">{parentCat}</span>
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                           {CATEGORY_HIERARCHY[parentCat as keyof typeof CATEGORY_HIERARCHY].map(sub => (
                              <button 
                                key={sub} 
                                onClick={() => { setView('home'); setSelectedCategory(`${parentCat} - ${sub}`); setIsMobileMenuOpen(false); }} 
                                className={`text-left px-4 py-3 border rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all ${selectedCategory === `${parentCat} - ${sub}` ? 'text-rose-600 border-rose-300 bg-rose-50/50 dark:bg-rose-900/30' : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-transparent hover:border-rose-200'}`}
                              >
                                {sub}
                              </button>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </header>
  );
};

const OrderCountdown = ({ orderDate, deliveryDays }: { orderDate: string, deliveryDays: number }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
      const interval = setInterval(() => {
        const target = new Date(orderDate).getTime() + (deliveryDays * 24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diff = target - now;
        if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        let timeString = '';
        if (d > 0) timeString += `${d}d `;
        timeString += `${h}h ${m}m ${s}s`;
        
        setTimeLeft(timeString);
      }, 1000);
      return () => clearInterval(interval);
    }, [orderDate, deliveryDays]);
    return <span className="text-rose-500 font-bold ml-2 animate-pulse">{timeLeft}</span>;
  };

// --- Admin Dashboard Component ---
const AdminVault = ({ currentUser, products, orders, users, onAdd, onDelete, onUpdateUser, onDeleteUser, onUpdateOrder, onBulkUpdate }: any) => {
  const [tab, setTab] = useState<'analytics' | 'products' | 'orders' | 'users'>('analytics');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 100, category: 'Women' as any, stock: 10, image: '', description: '', isHot: false });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [expandedStat, setExpandedStat] = useState<string | null>(null);
    // Orders Expand State
    const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
    const toggleOrder = (id: string) => setExpandedOrders(prev => prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]);

    // Users Expand & View State
    const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
    const toggleUser = (id: string) => setExpandedUsers(prev => prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Clear new users badge when tab is visited
    useEffect(() => {
      if (tab === 'users') {
        const timer = setTimeout(() => {
          localStorage.setItem('admin_users_viewed', Date.now().toString());
        }, 5000); // Wait 5 seconds before marking as viewed
        return () => clearTimeout(timer);
      }
    }, [tab]);

  const prevOrderCount = useRef(orders.length);

useEffect(() => {
  // If order count increases, it's a new order! Play a cool futuristic sound
  if (orders.length > prevOrderCount.current) {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio autoplay blocked"));
    // Update the ref
    prevOrderCount.current = orders.length;
  }
}, [orders.length]);
  
  const stats = useMemo(() => ({
    revenue: orders.filter((o:any)=> o.status !== 'Cancelled').reduce((s: number, o: any) => s + (o.total || 0), 0),
    avgOrder: orders.filter((o:any)=> o.status !== 'Cancelled').length ? orders.filter((o:any)=> o.status !== 'Cancelled').reduce((s: number, o: any) => s + (o.total || 0), 0) / orders.filter((o:any)=> o.status !== 'Cancelled').length : 0,
    activeUsers: users.length,
    inventoryValue: products.reduce((s: number, p: any) => s + ((p.price || 0) * (p.stock || 0)), 0)
  }), [orders, users, products]);

  const salesTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        date: d.getMonth(),
        name: d.toLocaleString('en-US', { month: 'short' }),
        sales: 0
      });
    }

    orders.forEach((o: any) => {
      if (o.status === 'Cancelled') return;
      const oDate = new Date(o.date || o.createdAt);
      const monthObj = months.find(m => m.date === oDate.getMonth());
      if (monthObj) monthObj.sales += (o.total || 0);
    });
    return months;
  }, [orders]);

const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onBulkUpdate('edit', editingProduct.id, editingProduct);
      setEditingProduct(null);
    } else {

      onAdd({ 
        ...newProduct, 
        rating: 5, 
        reviewsCount: 0,
        image: newProduct.image || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'
      });
      setShowAddForm(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  // Sort Citizens: Faith on top, then admins, then customers
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.email === 'skiller@skiller') return -1;
      if (b.email === 'skiller@skiller') return 1;
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return 0;
    });
  }, [users]);

  return (
    <div className="max-w-7xl mx-auto pt-32 pb-32 px-6 animate-future-in">
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
         <div className="space-y-2">
             <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 dark:bg-rose-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 dark:text-white shadow-neon">
                   <Shield className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                   <h2 className="text-3xl md:text-5xl font-serif italic font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
                   <p className="text-[8px] md:text-[10px] font-black uppercase text-rose-500 tracking-[0.4em] mt-1 md:mt-2">Store Overview</p>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap p-2 bg-slate-100 dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'orders', label: 'Orders', icon: ClipboardList, badge: orders.filter((o:any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length },
                { id: 'users', label: 'Users', icon: Users, badge: users.filter((u:any) => new Date(u.joinedAt).getTime() > (Number(localStorage.getItem('admin_users_viewed')) || 0)).length }
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)} className={`relative flex items-center gap-1.5 md:gap-2 px-4 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                  {(t.badge !== undefined && t.badge > 0) && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] min-w-[18px] h-5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-800 shadow-neon">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
       </div>

{tab === 'analytics' && (
         <div className="space-y-6 md:space-y-10 animate-fade-in w-full overflow-hidden">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
               {[
                 { id: 'revenue', label: 'Total Revenue', val: `Ksh ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', desc: 'Click to view breakdown' },
                 { id: 'users', label: 'Active Citizens', val: stats.activeUsers, icon: Users, color: 'text-sky-500', desc: 'Click to view demographics' },
                 { id: 'aov', label: 'Avg Order Value', val: `Ksh ${Math.round(stats.avgOrder).toLocaleString()}`, icon: TrendingUp, color: 'text-rose-500', desc: 'Click to view extremes' },
                 { id: 'pool', label: 'Pool Value', val: `Ksh ${stats.inventoryValue.toLocaleString()}`, icon: Gem, color: 'text-amber-500', desc: 'Click to view inventory split' }
               ].map((s: any, i: number) => (
                 <div key={i} onClick={() => setExpandedStat(s.id)} className="bg-white dark:bg-slate-900 p-6 md:p-8 lg:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-center cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] transition-all group overflow-hidden">
                    <s.icon className={`w-6 h-6 md:w-8 md:h-8 mb-4 md:mb-6 ${s.color} group-hover:scale-110 transition-transform shrink-0`} />
                    <p className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest mb-1 md:mb-2">{s.label}</p>
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-black italic text-slate-900 dark:text-white truncate w-full" title={s.val}>{s.val}</h4>
                    <p className="text-[8px] font-mono text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6">{s.desc}</p>
                 </div>
               ))}
            </div>

            {/* EXPANDED MODAL OVERLAY */}
            {expandedStat && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setExpandedStat(null)}>
                 <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-4xl w-full max-h-[85vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setExpandedStat(null)} className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    
                    {expandedStat === 'revenue' && (
                      <>
                         <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-6 flex items-center gap-3"><DollarSign className="text-emerald-500 w-8 h-8"/> Revenue Ledger</h3>
                         <div className="overflow-y-auto pr-4 flex-1 space-y-4 scrollbar-hide">
                            {orders.filter((o:any) => o.status !== 'Cancelled').sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((o:any) => (
                              <div key={o._id || o.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                 <div>
                                   <p className="font-bold text-sm text-slate-900 dark:text-white">{o.userName || 'Unknown User'}</p>
                                   <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">ID: {(o._id || o.id).slice(-6)} • {new Date(o.date).toLocaleString()}</p>
                                 </div>
                                 <span className="font-black text-emerald-500 text-lg">Ksh {o.total?.toLocaleString()}</span>
                              </div>
                            ))}
                         </div>
                      </>
                    )}

                    {expandedStat === 'users' && (
                       <>
                          <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-6 flex items-center gap-3"><Users className="text-sky-500 w-8 h-8"/> User Demographics</h3>
                          <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] text-center"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Staff / Admins</p><p className="text-3xl font-black text-sky-500">{users.filter((u:any) => u.role === 'admin' || u.email==='skiller@skiller').length}</p></div>
                             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] text-center"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Active Customers</p><p className="text-3xl font-black text-slate-900 dark:text-white">{users.filter((u:any) => u.role !== 'admin' && u.email!=='skiller@skiller').length}</p></div>
                          </div>
                          <div className="overflow-y-auto pr-4 flex-1 space-y-4 scrollbar-hide">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 mt-4">Recent Registrations</p>
                             {users.sort((a:any,b:any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, 20).map((u:any) => (
                                <div key={u._id || u.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-3">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                        {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                                      </div>
                                   </div>
                                   <span className="text-xs font-mono font-bold text-slate-400">{new Date(u.joinedAt).toLocaleDateString()}</span>
                                </div>
                             ))}
                          </div>
                       </>
                    )}

                    {expandedStat === 'aov' && (
                       <>
                          <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-6 flex items-center gap-3"><TrendingUp className="text-rose-500 w-8 h-8"/> Average Order Value Metrics</h3>
                          <div className="overflow-y-auto pr-4 flex-1 space-y-4 scrollbar-hide">
                             <div className="p-10 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[32px] text-center mb-8 shadow-inner">
                                <p className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">Calculated Average</p>
                                <p className="text-5xl font-black italic text-rose-500 drop-shadow-md">Ksh {Math.round(stats.avgOrder).toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold">Calculated across {orders.filter((o:any)=>o.status!=='Cancelled').length} verified transactions.</p>
                             </div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Extremes (Highest vs Lowest)</p>
                             {orders.filter((o:any)=>o.status!=='Cancelled').length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] flex flex-col border-t-4 border-emerald-500 hover:shadow-lg transition-shadow">
                                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2">Maximum Record</p>
                                      <span className="font-black text-emerald-500 text-3xl mb-4 italic">Ksh {orders.filter((o:any)=>o.status!=='Cancelled').reduce((max:any, o:any) => (o.total || 0) > (max.total || 0) ? o : max, orders[0]).total?.toLocaleString()}</span>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-auto">{orders.filter((o:any)=>o.status!=='Cancelled').reduce((max:any, o:any) => (o.total || 0) > (max.total || 0) ? o : max, orders[0]).userName || 'Unknown User'}</p>
                                   </div>
                                   <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] flex flex-col border-t-4 border-rose-500 hover:shadow-lg transition-shadow">
                                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2">Minimum Record</p>
                                      <span className="font-black text-rose-500 text-3xl mb-4 italic">Ksh {orders.filter((o:any)=>o.status!=='Cancelled').reduce((min:any, o:any) => (o.total || 0) < (min.total || 0) ? o : min, orders[0]).total?.toLocaleString()}</span>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-auto">{orders.filter((o:any)=>o.status!=='Cancelled').reduce((min:any, o:any) => (o.total || 0) < (min.total || 0) ? o : min, orders[0]).userName || 'Unknown User'}</p>
                                   </div>
                                </div>
                             ) : <p className="text-center text-slate-500 py-10 font-mono">No verified orders data.</p>}
                          </div>
                       </>
                    )}

                    {expandedStat === 'pool' && (
                       <>
                          <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-6 flex items-center gap-3"><Gem className="text-amber-500 w-8 h-8"/> Inventory Value Breakdown</h3>
                          <div className="overflow-y-auto pr-4 flex-1 space-y-4 scrollbar-hide">
                             <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 mt-2 px-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Product & Base Price</span>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pool Total Value (Ksh)</span>
                             </div>
                             {products.map((p:any) => ({ ...p, poolValue: (p.price || 0) * (p.stock || 0) })).sort((a:any,b:any) => b.poolValue - a.poolValue).map((p:any) => (
                                <div key={p.id || p._id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                   <div className="flex items-center gap-4">
                                      <img src={p.image} className="w-12 h-14 rounded-xl object-cover shadow-sm"/>
                                      <div>
                                         <p className="font-bold text-sm text-slate-900 dark:text-white w-32 md:w-64 truncate">{p.name}</p>
                                         <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">Vol: {p.stock} • Base: {p.price.toLocaleString()}</p>
                                      </div>
                                   </div>
                                   <span className="font-black text-amber-500 text-lg">{(p.poolValue).toLocaleString()}</span>
                                </div>
                             ))}
                          </div>
                       </>
                    )}
                 </div>
              </div>
            )}
            
            {/* Chart Container */}
            <div onClick={() => setExpandedStat('aov')} className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[32px] md:rounded-[64px] border border-slate-100 dark:border-slate-800 shadow-xl h-[350px] md:h-[400px] flex flex-col w-full cursor-pointer hover:shadow-2xl transition-all group relative">
               <div className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-4 h-4 text-rose-500"/></div>
               <h3 className="text-lg md:text-xl font-bold mb-6 md:mb-10 text-slate-900 dark:text-white flex items-center gap-2 md:gap-3">
                 <Activity className="w-5 h-5 md:w-6 md:h-6 text-rose-500" /> Monthly Statistics & Insights
               </h3>
               <div className="flex-1 w-full min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend}>
                       <defs>
                         <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                       <YAxis hide />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                         labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                         itemStyle={{ color: '#e11d48', fontWeight: 'bold' }}
                       />
                       <Area type="monotone" dataKey="sales" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
         </div>
       )}
      
       {tab === 'products' && (
         <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
               <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Product Management</h3>
               <button onClick={() => { setShowAddForm(!showAddForm); setEditingProduct(null); }} className="w-full sm:w-auto px-6 md:px-8 py-3 bg-rose-600 text-white rounded-full font-black uppercase text-[9px] md:text-[10px] flex items-center justify-center gap-2 shadow-neon hover:scale-105 transition-all">
                  {showAddForm ? <X className="w-3 h-3 md:w-4 md:h-4" /> : <Plus className="w-3 h-3 md:w-4 md:h-4" />} {showAddForm ? 'Cancel' : 'Register New Product'}
               </button>
            </div>

            {(showAddForm || editingProduct) && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => { setShowAddForm(false); setEditingProduct(null); }}>
                <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-50 dark:border-slate-800 shadow-2xl animate-future-in max-w-4xl w-full max-h-[90vh] overflow-y-auto relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                 <button type="button" onClick={() => { setShowAddForm(false); setEditingProduct(null); }} className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-500 hover:text-white transition-colors z-10"><X className="w-5 h-5" /></button>
                 <h4 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-white">{editingProduct ? 'Adjusting Product Details' : 'New Product Details'}</h4>
                 <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <input required className="p-4 md:p-6 text-sm md:text-base bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold text-slate-900 dark:text-white" placeholder="Name" value={editingProduct ? editingProduct.name : newProduct.name} onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} />
                    <input required type="number" className="p-4 md:p-6 text-sm md:text-base bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold text-slate-900 dark:text-white [&::-webkit-inner-spin-button]:opacity-100" placeholder="Price (Ksh)" value={editingProduct ? (editingProduct.price || '') : (newProduct.price || '')} onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})} />
                    <input required type="number" className="p-4 md:p-6 text-sm md:text-base bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold text-slate-900 dark:text-white [&::-webkit-inner-spin-button]:opacity-100" placeholder="Pool (Quantity)" value={editingProduct ? (editingProduct.stock === 0 ? '' : editingProduct.stock) : (newProduct.stock === 0 ? '' : newProduct.stock)} onChange={e => editingProduct ? setEditingProduct({...editingProduct, stock: Number(e.target.value)}) : setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                    
                    <div className="relative">
                      <select className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-black uppercase text-[9px] md:text-[10px] text-slate-900 dark:text-white outline-none appearance-none" value={editingProduct ? editingProduct.category : newProduct.category} onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})}>
                         <optgroup label="General / Top Level">
                           <option value="Women">Women (All)</option>
                           <option value="Men">Men (All)</option>
                           <option value="Accessories">Accessories (All)</option>
                           <option value="Hot Deals">Hot Deals (Standalone)</option>
                         </optgroup>
                         {Object.keys(CATEGORY_HIERARCHY).map(parentCat => CATEGORY_HIERARCHY[parentCat as keyof typeof CATEGORY_HIERARCHY].length > 0 && (
                            <optgroup key={parentCat} label={`${parentCat} Specifics`}>
                              {CATEGORY_HIERARCHY[parentCat as keyof typeof CATEGORY_HIERARCHY].map(sub => (
                                 <option key={`${parentCat} - ${sub}`} value={`${parentCat} - ${sub}`}>{parentCat} - {sub}</option>
                              ))}
                            </optgroup>
                         ))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                   <div className="md:col-span-2 flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-[24px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        disabled={isUploadingImage}
                        className="w-full font-bold text-slate-900 dark:text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-rose-100 file:text-rose-600 hover:file:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingImage(true);
                            const url = await uploadToCloudinary(file);
                            if (url) {
                              if (editingProduct) setEditingProduct({...editingProduct, image: url});
                              else setNewProduct({...newProduct, image: url});
                            } else {
                              alert("Failed to sync image with Cloudinary.");
                            }
                            setIsUploadingImage(false);
                          }
                        }} 
                      />
                      {isUploadingImage ? (
                         <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center shrink-0 shadow-inner">
                            <Loader2 className="w-6 h-6 animate-spin text-rose-500"/>
                         </div>
                      ) : (editingProduct?.image || newProduct.image) && (
                        <img src={editingProduct ? editingProduct.image : newProduct.image} className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0" alt="Preview" />
                      )}
                    </div>

                  
                      <textarea required className="md:col-span-2 p-4 md:p-6 text-sm md:text-base bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold text-slate-900 dark:text-white h-24 md:h-32" placeholder="Description" value={editingProduct ? editingProduct.description : newProduct.description} onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} />
                    
                    <label className={`md:col-span-2 flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-2xl md:rounded-[24px] text-sm md:text-base font-bold cursor-pointer select-none transition-all duration-300 border-2 ${
                       (editingProduct ? editingProduct.isHot : newProduct.isHot) 
                         ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.2)]' 
                         : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-900 dark:text-white hover:border-rose-200'
                    }`}>
                       <div className={`w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
                          (editingProduct ? editingProduct.isHot : newProduct.isHot) 
                          ? 'bg-rose-500 border-rose-500' 
                          : 'border-slate-300 dark:border-slate-600'
                       }`}>
                          {(editingProduct ? editingProduct.isHot : newProduct.isHot) && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                       </div>
                       <input type="checkbox" checked={editingProduct ? editingProduct.isHot : newProduct.isHot} onChange={e => editingProduct ? setEditingProduct({...editingProduct, isHot: e.target.checked}) : setNewProduct({...newProduct, isHot: e.target.checked})} className="hidden" />
                       Mark as "Hot Deal" 🔥 
                       <span className="text-[8px] md:text-[10px] font-mono text-slate-400 font-normal ml-auto">(Glows when active)</span>
                    </label>

                    <button disabled={isUploadingImage} className="md:col-span-2 py-4 md:py-6 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl md:rounded-[32px] font-black uppercase tracking-widest text-[9px] md:text-[11px] hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                       {isUploadingImage ? 'Uploading Image...' : 'Commit Configuration'}
                    </button>
                 </form>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-50 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto"> 
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr>
                        <th className="px-4 md:px-8 py-4 md:py-6 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1 md:gap-2">Product <ArrowUpDown className="w-2 h-2 md:w-3 md:h-3" /></div>
                        </th>
                        <th className="px-4 md:px-8 py-4 md:py-6 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => handleSort('category')}>
                          <div className="flex items-center gap-1 md:gap-2">Category <ArrowUpDown className="w-2 h-2 md:w-3 md:h-3" /></div>
                        </th>
                        <th className="px-4 md:px-8 py-4 md:py-6 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => handleSort('price')}>
                          <div className="flex items-center gap-1 md:gap-2">Price <ArrowUpDown className="w-2 h-2 md:w-3 md:h-3" /></div>
                        </th>
                        <th className="px-4 md:px-8 py-4 md:py-6 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => handleSort('stock')}>
                          <div className="flex items-center gap-1 md:gap-2">Qty <ArrowUpDown className="w-2 h-2 md:w-3 md:h-3" /></div>
                        </th>
                        <th className="px-4 md:px-8 py-4 md:py-6 text-right">Commands</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {sortedProducts.map((p: any) => (
                       <tr key={p.id || p._id} className="hover:bg-rose-50/20 dark:hover:bg-slate-800/50 transition-all group">
                          <td className="px-4 md:px-8 py-4 md:py-6 flex items-center gap-3 md:gap-4">
                             <img src={p.image} className="w-10 h-14 md:w-12 md:h-16 rounded-xl object-cover shadow-lg" />
                             <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate max-w-[100px] md:max-w-none">{p.name}</span>
                          </td>
                           <td className="px-4 md:px-8 py-4 md:py-6">
                             <span className="text-[8px] md:text-[10px] font-black uppercase text-rose-500">{p.category}</span>
                             {p.isHot && <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[7px] md:text-[8px] font-black uppercase tracking-wider">Hot</span>}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 font-black text-xs md:text-sm text-slate-900 dark:text-white">Ksh {p.price.toLocaleString()}</td>
                          <td className="px-4 md:px-8 py-4 md:py-6 font-black text-xs md:text-sm text-slate-900 dark:text-white">{p.stock}</td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                             <div className="flex gap-2 md:gap-4 justify-end">
                                <button onClick={() => setEditingProduct(p)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => onDelete(p.id)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               </div>
            </div>
         </div>
       )}

      {tab === 'orders' && (
        <div className="space-y-8 animate-fade-in">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 font-mono">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-rose-500" /> Active Orders
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {orders.map((o: any) => {
              const daysLeft = o.deliveryDays || (o.deliveryMethod === 'Express Drone' ? 1 : 3); 
              const isDelivered = o.status === 'Delivered' || o.status === 'Cancelled';
              const isExpanded = expandedOrders.includes(o._id || o.id);

              return (
                <div key={o._id || o.id} className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] border ${isDelivered ? 'border-emerald-500/30' : 'border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.15)]'} transition-all relative overflow-hidden flex flex-col`}>
                  
                  {/* Collapsed Header (Always Visible) */}
                  <div className="p-4 md:p-6 flex items-center justify-between cursor-pointer" onClick={() => toggleOrder(o._id || o.id)}>
                    <div className="flex items-center gap-3 md:gap-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-100 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                         {o.userProfilePic || users.find((u:any) => u.id === o.userId || u._id === o.userId)?.profilePic ? <img src={users.find((u:any) => u.id === o.userId || u._id === o.userId)?.profilePic || o.userProfilePic} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />}
                       </div>
                      <div>
                         <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-white font-mono flex items-center gap-1.5 md:gap-2">
                           <span className="truncate max-w-[100px] sm:max-w-[200px]">{o.userName || 'Anonymous Entity'}</span>
                           {!isDelivered && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#e11d48]"></span>}
                         </p>
                         <p className="font-mono text-[8px] md:text-[9px] uppercase text-rose-500 tracking-widest mt-0.5">
                           ID: {(o._id || o.id || 'XXXX').slice(-6).toUpperCase()} 
                         </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-mono uppercase tracking-widest border ${
                        o.status === 'Processing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                        o.status === 'Shipped' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 
                        o.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>{o.status || 'Processing'}</span>
                      {isDelivered && <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                    </div>
                  </div>

                  {/* Expanded Content Area */}
            {(!isDelivered || isExpanded) && (
              <div className="px-6 pb-6 animate-fade-in border-t border-slate-100 dark:border-white/5 pt-6">
                {!isDelivered && <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none"></div>}
                
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 md:p-5 rounded-2xl mb-4 md:mb-6 relative z-10 border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <span className="font-mono text-[8px] md:text-[10px] uppercase text-slate-500">Value Processed</span>
                    <span className="text-lg md:text-xl font-mono font-bold text-slate-900 dark:text-white">Ksh {o.total?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-white/5">
                    <span className="font-mono text-[8px] md:text-[9px] uppercase text-slate-500">Order Placed</span>
                    <span className="font-mono text-[8px] md:text-[10px] text-slate-900 dark:text-white font-bold">{new Date(o.date).toLocaleDateString()} at {new Date(o.date).toLocaleTimeString()}</span>
                  </div>
            
                  {!isDelivered && (
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 md:py-4 border-t border-slate-200 dark:border-white/5 gap-2">
                      <div className="flex flex-col">
                         <span className="font-mono text-[8px] md:text-[9px] uppercase text-slate-500 flex items-center gap-1.5 md:gap-2"><Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 animate-spin-slow" /> Estimated Drop</span>
                          <span className="text-[7px] md:text-[8px] font-black uppercase text-sky-500 tracking-widest mt-1">
                            {o.deliveryMethod || 'Standard Delivery'} - {o.deliveryDays || (o.deliveryMethod === 'Express Drone' ? 1 : 3)} Days
                          </span>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-[8px] md:text-[10px] font-mono font-black border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                          EST: {(() => {
                            const d = new Date(o.date || Date.now());
                            d.setDate(d.getDate() + daysLeft);
                            return d.toLocaleDateString();
                          })()}
                        </span>
                        <OrderCountdown orderDate={o.date} deliveryDays={daysLeft} />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-3 md:pt-4 border-t border-slate-200 dark:border-white/5">
                    <p className="font-mono text-[8px] md:text-[9px] text-slate-500 flex items-center gap-1.5 md:gap-2"><Smartphone className="w-2.5 h-2.5 md:w-3 md:h-3 text-sky-400"/> Sync No: {o.phoneNumber}</p>
                    <p className="font-mono text-[8px] md:text-[9px] text-slate-500 flex items-start gap-1.5 md:gap-2">
                      <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 text-rose-400 mt-0.5"/> 
                      <span className="flex-1 leading-snug">Delivery Address: {o.address || users.find((u:any) => u.id === o.userId || u._id === o.userId)?.address || 'Not specified'}</span>
                    </p>
                  </div>
                  
                 {/* Purchased Items List */}
                  <div className="py-3 md:py-4 border-t border-slate-200 dark:border-white/5 mt-3">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-mono text-[8px] md:text-[9px] uppercase text-slate-500 block">Cart Items</span>
                       <span className="font-mono text-[7px] md:text-[8px] uppercase text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Total Items: {o.items?.length || 0}</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e11d48 transparent' }}>
                      {o.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] md:text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img src={item.image} className="w-8 h-10 md:w-10 md:h-12 rounded shadow-sm object-cover shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 font-bold truncate flex-1">{item.name} <span className="text-rose-500 ml-1 font-black">x{item.quantity}</span></span>
                          </div>
                          <span className="text-slate-500 font-mono font-bold shrink-0">Ksh {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            
                {/* Admin Update Controls */}
                      {!isDelivered && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 relative z-10">
                          <div className="flex-1 relative">
                            <select 
                              value={o.status || 'Processing'} 
                              onChange={(e) => {
                                if (e.target.value === 'Cancelled') {
                                  if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
                                }
                                onUpdateOrder(o._id || o.id, { status: e.target.value });
                              }}
                              className={`w-full ${o.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-white/10'} p-3 md:p-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-mono font-bold uppercase outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer transition-colors appearance-none border`}
                            >
                              <option value="Processing">Set: Processing</option>
                              <option value="Shipped">Set: Shipped</option>
                              <option value="Delivered">Set: Delivered</option>
                              <option value="Cancelled">Cancel Order</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                           
                           {/* Next Stage Sync Button */}
                           <button onClick={() => {
                             const stages = ['Processing', 'Shipped', 'Delivered'];
                             const currentIdx = stages.indexOf(o.status || 'Processing');
                             if (currentIdx > -1 && currentIdx < 2) {
                               const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                               audio.play().catch(() => {});
                               onUpdateOrder(o._id || o.id, { status: stages[currentIdx + 1] });
                             }
                           }} className="w-full sm:w-12 sm:h-12 md:w-14 md:h-14 py-3 sm:py-0 bg-rose-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all active:scale-90 shrink-0" title="Push to Next Stage">
                             <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                           </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {orders.length === 0 && <div className="p-40 text-center font-mono text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">No active data.</div>}
        </div>
      )}

                {tab === 'users' && (
                  <div className="space-y-8 animate-fade-in relative">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">Users Directory</h3>
                    
                    {/* Full Screen Image Viewer Modal */}
                    {viewingImage && (
                      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" onClick={() => setViewingImage(null)}>
                        <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-6 h-6" /></button>
                        <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      {sortedUsers.map((u: any, index: number) => {
                        const isNewUser = new Date(u.joinedAt).getTime() > (Number(localStorage.getItem('admin_users_viewed')) || 0) - 5000;
                        const isExpanded = expandedUsers.includes(u.id || u._id);
                        const userTotal = orders.filter((o:any) => o.userId === (u.id || u._id) && o.status !== 'Cancelled').reduce((sum:number, o:any) => sum + o.total, 0);

                        return (
                        <div key={u.id || u._id} style={{animationDelay: `${index * 100}ms`}} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-lg relative overflow-hidden group animate-fade-in-up">
                          {isNewUser && <div className="absolute top-4 right-4 z-20 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-wider rounded-md animate-pulse">New</div>}
                          {u.email === 'skiller@skiller' && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>}
                          
                          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 relative z-10 cursor-pointer" onClick={() => toggleUser(u.id || u._id)}>
                            <div 
                              className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-lg md:text-xl border-2 border-white dark:border-slate-700 shadow-xl overflow-hidden shrink-0 cursor-zoom-in"
                              onClick={(e) => { e.stopPropagation(); if(u.profilePic) setViewingImage(u.profilePic); }}
                            >
                              {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate font-mono">
                                {u.name} 
                                {u.email === 'skiller@skiller' && <Crown className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
                              </h4>
                              <p className="font-mono text-[9px] text-slate-500 tracking-widest truncate mt-1 mb-1">{u.email}</p>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                u.email === 'skiller@skiller' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                                u.role === 'admin' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {u.email === 'skiller@skiller' ? 'Manager' : u.role === 'admin' ? 'Admin' : 'Customer'}
                              </span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>

                          {/* Expandable Details Box */}
                          {isExpanded && (
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl mb-4 text-xs space-y-2 border border-slate-100 dark:border-white/5 animate-fade-in relative z-10">
                              <p className="text-slate-500 flex justify-between"><span className="font-bold">Phone:</span> <span className="text-slate-900 dark:text-white">{u.phoneNumber || 'N/A'}</span></p>
                              <p className="text-slate-500 flex justify-between"><span className="font-bold">Drop-off:</span> <span className="text-slate-900 dark:text-white truncate max-w-[120px]" title={u.address}>{u.address || 'N/A'}</span></p>
                              <p className="text-slate-500 flex justify-between"><span className="font-bold">Joined:</span> <span className="text-slate-900 dark:text-white">{new Date(u.joinedAt).toLocaleDateString()}</span></p>
                              <p className="text-slate-500 flex justify-between"><span className="font-bold">Purchases:</span> <span className="text-emerald-500 font-black">Ksh {userTotal.toLocaleString()}</span></p>
                            </div>
                          )}
                          
                          {u.email !== 'skiller@skiller' && (

                          <div className="flex gap-2 md:gap-3 relative z-10 pt-3 md:pt-4 border-t border-slate-100 dark:border-white/5">
                            <button 
                              onClick={() => { if (currentUser.email !== 'skiller@skiller') return alert("Only the Supreme Architect can modify permissions."); onUpdateUser(u._id || u.id, { role: u.role === 'admin' ? 'customer' : 'admin' }) }} 
                              className={`flex-1 py-2 md:py-3 rounded-lg md:rounded-xl font-mono font-bold text-[8px] md:text-[9px] uppercase tracking-widest transition-all ${currentUser.email === 'skiller@skiller' ? (u.role === 'admin' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white') : 'bg-slate-50 dark:bg-slate-950 text-slate-400 cursor-not-allowed opacity-50'}`}
                            >
                              {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button 
                              onClick={() => { 
                                if (currentUser.email !== 'skiller@skiller') return alert("Only the Supreme Architect can Delete Users."); 
                                if (window.confirm(`Are you sure you want to delete ${u.name}?`)) onDeleteUser(u._id || u.id) 
                              }} 
                              className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all ${currentUser.email === 'skiller@skiller' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 cursor-not-allowed opacity-50'}`}
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )}
    </div>
  );
};

// --- Auth View ---
const AuthView = ({ onAuthSuccess, showToast }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '', address: '', password: '', confirmPassword: '' });
  
  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      return showToast("Passwords do not match.", "error");
    }
    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      // Clean payload – never send confirmPassword
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { 
            name: formData.name, 
            email: formData.email, 
            phoneNumber: formData.phoneNumber, 
            address: formData.address,
            password: formData.password 
          };
      const res = await fetch(`\( {API_BASE} \){endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
      const authData = await res.json();
      if (!res.ok) throw new Error(authData.message || "Identity verification failed.");
      onAuthSuccess(authData.user, authData.token);
    } catch (err: any) {
      showToast(err.message || "Sanctuary server is offline.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Development mock: Alert the OTP since you don't have email setup yet
      alert(`MOCK EMAIL: Your OTP is ${data.mockOtp}`); 
      showToast("OTP sent to your email address.", "success");
      setOtpStep(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resetData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showToast(data.message, "success");
      setIsForgotPassword(false);
      setOtpStep(false);
      setIsLogin(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const SocialLoginButton = ({ icon: Icon, provider }: any) => (
    <button type="button" onClick={() => showToast(`OAuth for ${provider} requires backend setup. Coming soon!`, 'info')} className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-rose-300 transition-all shadow-sm">
      <Icon className="w-5 h-5" />
    </button>
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12 md:py-20 overflow-y-auto">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-future-in text-center relative mt-auto mb-auto">
           <button onClick={() => { setIsForgotPassword(false); setOtpStep(false); }} className="absolute top-6 left-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500"><ArrowLeft className="w-4 h-4"/></button>
           <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-6" />
           <h2 className="text-2xl font-serif italic font-bold text-slate-900 dark:text-white mb-2">Password Recovery</h2>
           <p className="text-slate-500 text-xs mb-8">{otpStep ? "Enter the 4-digit code sent to your email." : "Enter your email to receive a secure code."}</p>
           
           {!otpStep ? (
             <form onSubmit={handleRequestOTP} className="space-y-4">
                <input required type="email" placeholder="Email Address" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white border border-transparent focus:border-rose-300" value={resetData.email} onChange={e => setResetData({...resetData, email: e.target.value})} />
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-rose-500 active:scale-95 disabled:opacity-50">
                  {isLoading ? 'Processing...' : 'Send OTP'}
                </button>
             </form>
           ) : (
             <form onSubmit={handleResetPassword} className="space-y-4">
                <input required type="text" maxLength={4} placeholder="4-Digit OTP" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white border border-transparent focus:border-rose-300 text-center tracking-[0.5em] text-xl" value={resetData.otp} onChange={e => setResetData({...resetData, otp: e.target.value})} />
                <input required type="password" placeholder="New Password" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white border border-transparent focus:border-rose-300" value={resetData.newPassword} onChange={e => setResetData({...resetData, newPassword: e.target.value})} />
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-emerald-400 active:scale-95 disabled:opacity-50">
                  {isLoading ? 'Processing...' : 'Reset Password'}
                </button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12 md:py-20 overflow-y-auto">
     <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] md:rounded-[64px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-future-in text-center relative overflow-hidden mt-auto mb-auto">
        <div className="w-16 h-16 bg-rose-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-xl border-4 border-white dark:border-slate-900"><Lock className="w-6 h-6" /></div>
        <h2 className="text-3xl font-serif italic font-bold text-slate-900 dark:text-white mb-2">{isLogin ? 'Login' : 'Registration'}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs italic mb-6">Initialize your Skiller identity.</p>
        
        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          {!isLogin && <input required className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />}
          {!isLogin && <input required type="tel" className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Phone Number (M-Pesa)" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />}
          {!isLogin && <input required className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Drop-off Location / Delivery Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />}
          
          <input required type="email" className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="password" className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          {!isLogin && <input required type="password" className="w-full p-4 text-sm bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none text-slate-900 dark:text-white focus:border-rose-300 transition-all border border-transparent" placeholder="Confirm Password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />}
          
          {isLogin && <div className="text-right"><button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-rose-500 font-bold uppercase tracking-widest hover:text-rose-400">Forgot Password?</button></div>}

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-rose-500 transition-all active:scale-95 disabled:opacity-70">
            {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-8">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
             <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Or Continue With</span>
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>
          <div className="flex justify-center gap-4">
             <SocialLoginButton icon={Globe} provider="Google" />
             <SocialLoginButton icon={Github} provider="Github" />
             <SocialLoginButton icon={Users} provider="Facebook" />
          </div>
        </div>

        <button onClick={() => {setIsLogin(!isLogin); setFormData({name:'', email:'', phoneNumber:'', address:'', password:'', confirmPassword:''});}} className="mt-8 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 transition-colors tracking-widest flex flex-col items-center justify-center gap-1 mx-auto">          
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="text-rose-600 underline decoration-rose-500 underline-offset-4 hover:text-rose-400 py-1">{isLogin ? "Register Here" : "Log In Here"}</span>
        </button>
      </div>
    </div>
  );
};

const aiMemoryCache = new Map();

// --- Product Modal ---
const ProductModal = ({ product, isWishlisted, onToggleWishlist, onClose, onAddToCart, onAddReview, currentUser }: any) => {
  const [copy, setCopy] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

        useEffect(() => {
          const loadAI = async () => {
            setLoading(true);
            const dbDescription = product.description || "An exclusive masterpiece designed for the visionary. Expertly crafted to elevate your presence with unmatched elegance.";
            
            // Use dynamic cache key with timestamp fallback to bust Edge cache
            const uniqueCacheKey = `${product.id}-${product.name}`;
            
            if (aiMemoryCache.has(uniqueCacheKey)) {
              setCopy(dbDescription);
              setTips(aiMemoryCache.get(uniqueCacheKey));
              setLoading(false);
              return;
            }

            try {
                // Pass randomized parameter slightly internally to bypass strict Edge caching
                const t = await getStyleTips(`${product.name}`);
                aiMemoryCache.set(uniqueCacheKey, t);
                setCopy(dbDescription); 
                setTips(t);
            } catch (err) {
                setCopy(dbDescription);
                setTips(["Pair with minimalistic accessories to maintain a clean profile.", "Ideal for high-end evening events.", "Maintain fabric integrity by avoiding direct harsh elements."]);
            } finally {
                setLoading(false);
            }
          };
          loadAI();
        }, [product]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Identify self to transmit a review.");
    if (!reviewComment.trim()) return;

    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id || currentUser._id, // Added ID
      userName: currentUser.name,
      userProfilePic: currentUser.profilePic, // Added Profile Pic
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString()
    };

    onAddReview(product.id, newReview);
    setReviewComment('');
    setReviewRating(5);
  };

 return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-fade-in">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl m-auto bg-white dark:bg-slate-900 h-[90vh] md:h-[85vh] rounded-[32px] md:rounded-[64px] shadow-2xl overflow-hidden flex flex-row border border-white/10">
        
        {/* DESKTOP Image (Hidden on mobile) */}
        <div className="hidden md:block w-1/2 relative h-full">
          <img src={product.image} className="w-full h-full object-cover" />
        </div>

        {/* RIGHT SIDE (Takes full width on mobile, separates scroll content from fixed footer) */}
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
          
          {/* SCROLLING CONTENT AREA */}
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col w-full">
            
            {/* MOBILE Image (Scrolls with text, hidden on desktop) */}
            <div className="block md:hidden w-full relative h-[45vh] shrink-0">
              <img src={product.image} className="w-full h-full object-cover" />
              <button onClick={onClose} className="fixed top-6 right-6 p-3 bg-white/20 backdrop-blur-xl border border-white/40 text-white rounded-full hover:bg-rose-500 hover:border-rose-500 transition-all z-[140] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Text Content */}
            <div className="p-6 md:p-16 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-[0.4em]">{product.category}</span>
                <button onClick={onClose} className="hidden md:block p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X className="w-8 h-8" /></button>
              </div>
              <h2 className="text-3xl md:text-5xl font-serif italic font-bold text-slate-900 dark:text-white mb-4 md:mb-6 leading-tight">{product.name}</h2>
              
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                <span className="text-2xl md:text-4xl font-black italic text-rose-600">Ksh {product.price.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-amber-400">
                   {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'fill-current' : ''}`} />)}
                   <span className="text-[10px] font-bold text-slate-400 ml-2">({product.reviewsCount})</span>
                </div>
              </div>
              
              <div className="space-y-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Description</h4>
                  <p className="text-lg text-slate-600 dark:text-slate-300 italic font-light leading-relaxed">
                    {product.description || (loading ? 'Loading narrative...' : copy)}
                  </p>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3 text-rose-500" /> Style Tips</h4>
                   {loading ? <div className="h-20 animate-pulse bg-slate-50 dark:bg-slate-800 rounded-3xl" /> : tips.map((t, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 md:p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100/50">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t}</p>
                     </div>
                   ))}
                </div>

                  <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-white/5">
                  
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-1">
                        <Terminal className="w-3 h-3 text-sky-400" /> Customer Reviews
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{product.reviewsCount || 0} Comment(s)</p>
                    </div>
                    {product.reviews?.length > 2 && (
                      <button onClick={() => setShowAllComments(!showAllComments)} className="font-mono text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors border-b border-rose-500/30 pb-0.5">
                        {showAllComments ? '[ SHOW LESS ]' : '[ VIEW ALL ]'}
                      </button>
                    )}
                  </div>

                  {/* Flexible Comments Display Box */}
                  <div className={`space-y-4 transition-all duration-500 overflow-y-auto scrollbar-hide pr-2 ${showAllComments ? 'max-h-[400px]' : 'max-h-[180px]'}`}>
                    {product.reviews?.length ? (
                      (showAllComments ? product.reviews : product.reviews.slice(0, 2)).map((r: any) => {
                        // Attempt to match the review to a real user in the system to get their latest profile pic
                        // (If you pass 'users' array to this modal later, you could do users.find(u => u.id === r.userId). For now, we use what's stored in the review, or fallback to the current user's pic if it's their review)
                        const isThisUser = currentUser && currentUser.id === r.userId;
                        const displayPic = isThisUser ? currentUser.profilePic : r.userProfilePic;

                        return (
                        <div key={r.id || r.userId} className="bg-slate-50/50 dark:bg-slate-950/50 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 flex gap-4 items-start group hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner border border-slate-300 dark:border-slate-700">
                            {displayPic ? <img src={displayPic} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-xs font-mono truncate max-w-[100px] sm:max-w-none">
                                {r.userName || r.name || 'Verified Customer'}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 tracking-widest">{new Date(r.date).toLocaleDateString()}</span>
                              <div className="flex gap-0.5 text-amber-400 ml-auto drop-shadow-[0_0_5px_rgba(251,191,36,0.3)] shrink-0">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-current' : 'opacity-30'}`} />)}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic break-words whitespace-pre-wrap overflow-hidden">"{r.comment}"</p>
                          </div>
                        </div>
                      )})
                    ) : (
                      <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[24px]">
                        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">No resonance detected.</p>
                      </div>
                    )}
                  </div>

                  {/* Smart User Input / Edit Section */}
                  <div className={`p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 transition-all duration-500 relative mt-8 ${
                      currentUser && product.reviews?.find((r: any) => r.userId === currentUser.id) && !isEditingReview 
                      ? 'border-transparent bg-slate-50 dark:bg-slate-900/50' 
                      : 'border-dashed border-rose-200 dark:border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/10'
                  }`}>
                    
                    {currentUser && product.reviews?.find((r: any) => r.userId === currentUser.id) && !isEditingReview ? (
                      
                      /* VIEW MODE: User has commented and is NOT editing */
                      <div className="text-center relative z-10">
                        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        <h5 className="font-mono text-[9px] uppercase text-emerald-500 tracking-[0.3em] mb-4">Your Review</h5>
                        
                        <div className="flex justify-center items-center gap-4 mb-4">
                          <div className="flex gap-1 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                             {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= (product.reviews.find((r: any) => r.userId === currentUser.id)?.rating || 5) ? 'fill-current' : 'opacity-30'}`} />)}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-6">"{product.reviews.find((r: any) => r.userId === currentUser.id)?.comment}"</p>
                        
                        <button onClick={() => {
                          setReviewRating(product.reviews.find((r: any) => r.userId === currentUser.id)?.rating || 5);
                          setReviewComment(product.reviews.find((r: any) => r.userId === currentUser.id)?.comment || '');
                          setIsEditingReview(true);
                        }} className="flex items-center gap-2 mx-auto font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-950 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-white/5">
                          <Edit3 className="w-3 h-3" /> Edit Review
                        </button>
                      </div>

                    ) : (
                      
                      /* EDIT/CREATE MODE: User is typing a new comment or editing an old one */
                      <form onSubmit={(e) => { handleReviewSubmit(e); setIsEditingReview(false); }} className="space-y-6 relative z-10">
                        <h5 className="font-mono text-[10px] font-bold uppercase text-slate-900 dark:text-rose-400 mb-6 tracking-widest flex items-center gap-2">
                          <Terminal className="w-3 h-3" /> {isEditingReview ? 'Edit Comment' : 'Write a Review'}
                        </h5>
                        
                        <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="font-mono text-[9px] uppercase text-slate-500 tracking-widest shrink-0">Rating:</span>
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button type="button" key={s} onClick={() => setReviewRating(s)} className="transition-transform hover:scale-125 active:scale-90">
                                <Star className={`w-6 h-6 ${s <= reviewRating ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'text-slate-300 dark:text-slate-700'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <textarea 
                          required
                          placeholder="Enter your comment..."
                          className="w-full p-5 bg-white/80 dark:bg-slate-950/80 rounded-[24px] font-mono outline-none text-xs text-slate-900 dark:text-white min-h-[100px] border border-slate-200 dark:border-white/10 focus:border-rose-400 dark:focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-slate-400 shadow-inner"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        />
                        
                        <div className="flex gap-4">
                          {isEditingReview && (
                            <button type="button" onClick={() => setIsEditingReview(false)} className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] font-mono font-bold uppercase tracking-widest text-[10px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
                              Cancel
                            </button>
                          )}
                          <button type="submit" className="flex-1 py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-[20px] font-mono font-bold uppercase tracking-widest text-[10px] hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] active:scale-95">
                            {isEditingReview ? 'Commit Changes' : 'Submit Review'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div> 
              </div>
            </div>
          </div>

          
          <div className="flex gap-4 p-6 border-t border-slate-100 dark:border-white/5 sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20">
             <button disabled={product.stock < 1} onClick={() => { onAddToCart(product); onClose(); }} className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 ${product.stock < 1 ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed' : 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:bg-rose-500'}`}>
               {product.stock < 1 ? 'Out of Stock' : `Add to Cart • Ksh ${product.price.toLocaleString()}`}
             </button>
             <button onClick={() => onToggleWishlist(product.id)} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center active:scale-90 ${isWishlisted ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/50'}`}>
               <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
             </button>
          </div>

        </div>
      </div> 
    </div>
    );
  };

// --- Custom Notification System (Cyber HUD) ---
const ToastMessage = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 right-6 z-[200] animate-fade-in flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl transition-all border ${
      type === 'error' ? 'bg-rose-950/80 border-rose-500/50 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]' :
      type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]' :
      'bg-slate-900/90 border-slate-700/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
    }`}>
      {type === 'error' ? <AlertCircle className="w-5 h-5 animate-pulse" /> : 
       type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
       <Terminal className="w-5 h-5" />}
      <span className="font-mono font-bold text-[10px] uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors ml-4">
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
};

const CartDrawer = ({ cart, setCart, onClose, onCheckout }: any) => {
  return (
  <div className="fixed inset-0 z-[110] flex animate-fade-in justify-end">
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative w-[90vw] sm:w-[400px] md:max-w-md bg-white dark:bg-slate-900 shadow-2xl h-[100dvh] max-h-[100dvh] flex flex-col transform transition-transform duration-500 ease-out border-l border-rose-100 dark:border-slate-800">
       <div className="p-6 md:p-10 border-b border-rose-50 dark:border-slate-800 flex justify-between items-center bg-rose-50/20 dark:bg-slate-800/20 shrink-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-rose-600 mb-1">My Cart</h2>
            <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{cart.length} Items in Cart</p>
          </div>
          <button onClick={onClose} className="p-3 md:p-5 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"><X className="w-6 h-6 md:w-8 md:h-8 text-rose-600" /></button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-8 scrollbar-hide">
          {cart.map((i: any, idx: number) => (
            <div key={idx} className="flex gap-4 md:gap-6 items-center group animate-fade-in bg-slate-50/80 dark:bg-slate-800/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] hover:bg-rose-50/50 transition-all border border-slate-100 dark:border-white/5">
               <div className="w-16 h-20 md:w-24 md:h-32 rounded-[16px] md:rounded-[24px] overflow-hidden shadow-lg shrink-0 bg-slate-200 dark:bg-slate-800">
                  <img src={i.image} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate pr-2">{i.name}</h4>
                    <button onClick={() => setCart(cart.filter((c: any) => c.id !== i.id))} className="text-slate-300 hover:text-rose-600 transition-colors p-1"><Trash className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[8px] md:text-[9px] font-black uppercase text-rose-500 mb-3 md:mb-6 tracking-widest truncate">{i.category}</p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mt-2">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm w-max border border-slate-100 dark:border-white/5">
                       <button onClick={() => setCart(cart.map((c: any) => c.id === i.id && c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c))} className="p-1"><Minus className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
                       <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white min-w-[12px] text-center">{i.quantity}</span>
                       <button onClick={() => setCart(cart.map((c: any) => (c.id === i.id && c.quantity < (c.stock || 99)) ? { ...c, quantity: c.quantity + 1 } : c))} className="p-1"><Plus className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
                    </div>
                    <span className="font-black italic text-sm md:text-lg text-slate-900 dark:text-white truncate">Ksh {(i.price * i.quantity).toLocaleString()}</span>
                  </div>
               </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center py-20 text-slate-300 font-black italic text-xl md:text-2xl">Cart status: Empty.</div>}
       </div>
       
       {cart.length > 0 && (
         <div className="p-6 md:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0 mt-auto sticky bottom-0 z-10">
            <div className="flex justify-between items-center text-xl md:text-3xl font-black mb-6 md:mb-8 italic text-slate-900 dark:text-white">
               <span>Total</span>
               <span className="text-rose-600 truncate max-w-[60%] text-right">Ksh {cart.reduce((s: any, i: any) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="w-full py-5 md:py-6 bg-slate-900 dark:bg-rose-600 text-white rounded-[20px] md:rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] shadow-xl hover:bg-rose-700 transition-all active:scale-95">Proceed to Checkout</button>
         </div>
       )}
    </div>
  </div>
  );
};
  
const CartToast = ({ product, onClose }: { product: Product, onClose: () => void }) => (
  <div className="fixed bottom-10 right-10 z-[200] animate-future-in bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-2xl border border-rose-100 dark:border-slate-800 flex items-center gap-6 max-w-sm">
    <div className="w-16 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
      <img src={product.image} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">Added to Sanctuary</p>
      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</h4>
    </div>
    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all">
      <X className="w-5 h-5 text-slate-400" />
    </button>
  </div>
);

const TrackOrderView = ({ orders, currentUser, isModal = false }: any) => {
  const userOrders = orders.filter((o: any) => o.userId === currentUser?._id || o.userId === currentUser?.id);
  const stages = ['Processing', 'Shipped', 'Delivered'];

  return (
    <div className={isModal ? "w-full animate-fade-in" : "max-w-6xl mx-auto pt-40 pb-32 px-6 animate-future-in"}>
       {/* Only show the massive title if we are on the full standalone page, NOT in the modal */}
       {!isModal && <h2 className="text-4xl md:text-6xl font-serif italic font-bold text-slate-900 dark:text-white mb-10 md:mb-16">Orders View</h2>}
       
       {userOrders.length === 0 ? (
         <div className="text-center py-20 md:py-40 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] md:rounded-[64px] italic text-slate-500 font-bold border border-slate-100 dark:border-white/5 shadow-sm">
           No active orders.
         </div>
       ) : (
         <div className="grid gap-6 md:gap-8">
           {userOrders.map((order: any) => {
             const currentIdx = stages.indexOf(order.status);
             return (
               <div key={order._id || order.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 lg:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                     <div className="min-w-0 flex-1">
                        <span className="px-4 py-1.5 bg-rose-600 text-white text-[9px] md:text-[10px] font-black uppercase rounded-full shadow-md tracking-widest">
                          Order #{(order._id || order.id).slice(-6)}
                        </span>
                        <h4 className="text-lg sm:text-xl md:text-2xl font-bold mt-4 text-slate-900 dark:text-white truncate">
                          {order.items.length} Item(s)
                        </h4>
                     </div>
                     <div className="sm:text-right shrink-0">
                        <p className="text-xl sm:text-2xl md:text-3xl font-black italic text-rose-600 truncate">
                          Ksh {order.total.toLocaleString()}
                        </p>
                     </div>
                  </div>

                  {/* Stage Progress Bar */}
                <div className="flex justify-between mb-3 md:mb-4">
                   {stages.map((s, i) => (
                     <span key={s} className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${order.status === 'Cancelled' ? 'text-rose-500' : i <= currentIdx ? 'text-emerald-500' : 'text-slate-400'}`}>
                       {order.status === 'Cancelled' && i === 0 ? 'Cancelled' : s}
                     </span>
                   ))}
                </div>
                <div className="h-2 md:h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex gap-1 overflow-hidden">
                   {stages.map((_, i) => (
                     <div key={i} className={`h-full flex-1 transition-all duration-1000 ${order.status === 'Cancelled' ? 'bg-rose-500' : i <= currentIdx ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`} />
                   ))}
                </div>

                {/* Purchased Items List */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Cart Data</p>
                   <div className="space-y-2">
                     {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] md:text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img src={item.image} className="w-8 h-10 md:w-10 md:h-12 rounded shadow-sm object-cover shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300 font-bold truncate flex-1">{item.name} <span className="text-rose-500 ml-1 font-black">x{item.quantity}</span></span>
                          </div>
                          <span className="text-slate-500 font-mono font-bold shrink-0">Ksh {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
               </div>
             )
           })}
         </div>
       )}
    </div>
  );
};
const CheckoutView = ({ cart, currentUser, onComplete, onAuth, showToast }: any) => {
  const [shipping, setShipping] = useState(SHIPPING_OPTIONS[0]);
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const total = useMemo(() => cart.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) + shipping.price, [cart, shipping]);
  
  const [awaitingMpesa, setAwaitingMpesa] = useState(false);

  const handlePay = async () => {
    if (!phoneNumber) return showToast('Payment Transaction Failure: Phone number missing.'); 
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mpesa/stkpush`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('faith_token')}`
        },
        body: JSON.stringify({ phone: phoneNumber, amount: total })
      });
      
      const data = await res.json();
      if (data.success) {
        setAwaitingMpesa(true);
        setLoading(false);
      } else { 
        showToast(data.message, 'error');  
        setLoading(false); 
      }
    } catch (e) {
      showToast("System sync error. Re-fresh page and try again", 'error');
      setLoading(false);
    }
  };

  const confirmPaymentCompletion = () => {
    onComplete({ 
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: currentUser.id || currentUser._id,
      items: cart, 
      total, 
      shippingMethod: shipping.name, 
      deliveryDays: parseInt(String(shipping.days).replace(/\D/g, '')) || (shipping.name.includes('Express') ? 1 : 3),
      status: 'Processing', 
      date: new Date().toISOString(), 
      phoneNumber 
    });
  };

  if (currentUser && !currentUser.address) {
    return (
      <div className="pt-32 md:pt-60 text-center animate-future-in px-6">
        <div className="mx-auto w-16 h-16 md:w-24 md:h-24 mb-6 md:mb-8 flex items-center justify-center text-rose-500">
          <MapPin className="w-8 h-8 md:w-12 md:h-12" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif italic font-bold text-slate-900 dark:text-white">Delivery Address Missing</h2>
        <p className="text-sm md:text-base text-slate-400 mt-4 italic">You must configure your Delivery Address in settings before settlement.</p>
        <button onClick={() => onAuth('profile')} className="mt-8 px-8 md:px-12 py-4 md:py-5 bg-rose-600 text-white rounded-full font-black uppercase text-[10px] shadow-2xl active-scale">
          Configure Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-28 md:pt-40 pb-20 md:pb-32 px-4 md:px-6 animate-future-in">
       <div className="mb-8 md:mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-4">
             <h2 className="text-3xl md:text-5xl font-serif italic font-bold text-slate-900 dark:text-white">Checkout</h2>
             <span className="text-[9px] md:text-[10px] font-black uppercase text-rose-500 tracking-widest">Step 1 of 3: Sync Payment</span>
          </div>
          <div className="h-1.5 md:h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-rose-500 via-emerald-500 to-sky-500 w-1/3 shadow-neon"></div>
          </div>
       </div>

       {/* Mobile: Order Summary is FIRST (order-1), Settlement is LAST (order-2) */}
       <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8 lg:gap-20">
          
          {/* M-PESA SETTLEMENT SECTION */}
          <div className="order-2 lg:order-1 lg:col-span-3 space-y-6 md:space-y-10">
             <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[32px] md:rounded-[56px] border border-slate-50 dark:border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-rose-500/5 blur-3xl"></div>
                <h3 className="text-xl md:text-2xl font-serif italic font-bold mb-6 md:mb-10 text-slate-900 dark:text-white flex items-center gap-3"><Smartphone className="w-5 h-5 md:w-6 md:h-6 text-rose-500" /> M-Pesa Settlement</h3>
                <div className="space-y-6 md:space-y-8">
                   <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-2 md:ml-4 tracking-widest">Enter M-Pesa Phone Number</label>
                      <input className="w-full p-5 md:p-8 bg-slate-50 dark:bg-slate-800 rounded-[20px] md:rounded-[32px] font-black text-2xl md:text-4xl outline-none focus:ring-2 focus:ring-rose-200 text-slate-900 dark:text-white transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" placeholder="07XX XXX XXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                      <p className="text-[8px] md:text-[9px] text-slate-400 italic ml-2 md:ml-4 uppercase tracking-tighter">Enter your M-Pesa number to receive the secure push.</p>
                   </div>
                   
                   <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-2 md:ml-4 tracking-widest">Shipping Speed</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                         {SHIPPING_OPTIONS.map(opt => (
                           <button 
                             key={opt.id} 
                             onClick={() => setShipping(opt)}
                             className={`p-4 md:p-6 rounded-[24px] md:rounded-[32px] border-2 transition-all text-left flex sm:flex-col justify-between items-center sm:items-start ${shipping.id === opt.id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-50 dark:border-slate-800 hover:border-rose-200'}`}
                           >
                              <div>
                                <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">{opt.name}</p>
                                <p className="text-[8px] md:text-[9px] text-slate-400 mt-1 uppercase font-bold">{opt.days}</p>
                              </div>
                              <p className="sm:mt-4 font-black italic text-rose-500 text-sm">Ksh {opt.price}</p>
                           </button>
                         ))}
                      </div>
                   </div>

                    {!awaitingMpesa ? (
                      <button onClick={handlePay} disabled={loading} className="w-full py-5 md:py-8 bg-rose-600 text-white rounded-[20px] md:rounded-[32px] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] flex items-center justify-center gap-3 shadow-xl hover:bg-rose-700 transition-all active-scale disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : <Shield className="w-5 h-5 md:w-6 md:h-6" />} 
                        {loading ? 'Synchronizing Transaction...' : 'Initiate Secure Payment'}
                      </button>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-emerald-200 dark:border-emerald-800 text-center animate-fade-in">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 animate-spin mx-auto mb-3 md:mb-4" />
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-bold mb-2 text-sm md:text-base">Payment Prompt Sent</h4>
                        <p className="text-[10px] md:text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-4 md:mb-6">Please check your phone, enter your M-Pesa PIN, and click the button below once payment is successful.</p>
                        <button onClick={confirmPaymentCompletion} className="w-full py-4 md:py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] md:text-[10px] shadow-lg hover:bg-emerald-600 transition-all">
                          I Have Paid (Confirm)
                        </button>
                      </div>
                    )}
                </div>
             </div>
          </div>

          {/* ORDER SUMMARY SECTION */}
          <div className="order-1 lg:order-2 lg:col-span-2">
             <div className="bg-slate-950 p-6 md:p-12 rounded-[32px] md:rounded-[64px] text-white shadow-2xl lg:sticky lg:top-32 overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/5 blur-3xl"></div>
                <h3 className="text-2xl md:text-3xl font-serif italic font-bold mb-6 md:mb-12">Order Summary</h3>
                <div className="space-y-4 md:space-y-6 mb-6 md:mb-12 max-h-48 md:max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                   {cart.map((i: any) => (
                     <div key={i.id} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 pr-4">
                           <div className="w-8 h-10 md:w-10 md:h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                             <img src={i.image} loading="lazy" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <span className="font-light text-[10px] md:text-xs opacity-60 truncate">
                             {i.name} <span className="text-rose-400 font-bold ml-1">x{i.quantity}</span>
                           </span>
                        </div>
                        <span className="font-black text-[10px] md:text-xs shrink-0">Ksh {(i.price * i.quantity).toLocaleString()}</span>
                     </div>
                   ))}
                </div>
                <div className="h-px bg-white/5 my-6 md:my-8"></div>
                <div className="space-y-4 md:space-y-6">
                   <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <span>Subtotal</span>
                      <span>Ksh {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <span>Shipping Fee</span>
                      <span>Ksh {shipping.price}</span>
                   </div>
                   <div className="space-y-2 md:space-y-3 pt-4 md:pt-6 border-t border-white/5">
                      <p className="text-rose-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em]">Grand Total</p>
                      <span className="text-3xl md:text-5xl lg:text-6xl font-black italic truncate block">Ksh {total.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- Main App Controller ---

const CyberMatrixRain = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 dark:mix-blend-screen opacity-40 dark:opacity-100">
      {[...Array(30)].map((_, i) => (
        <div 
          key={i} 
          className="absolute w-1 rounded-full bg-gradient-to-b from-transparent via-rose-500 to-rose-600 shadow-[0_0_20px_#e11d48]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 50 + 10}%`,
            height: `${Math.random() * 30 + 10}%`,
            animation: `cyber-fall ${Math.random() * 2 + 1.5}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes cyber-fall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const MainContent = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('faith_theme');
    return saved ? saved === 'dark' : true; // Default to dark theme
  });

  useEffect(() => {
    localStorage.setItem('faith_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS || []);
  const [cart, setCart] = useState<CartItem[]>(() => {
  const savedCart = localStorage.getItem('skiller_cart');
  return savedCart ? JSON.parse(savedCart) : [];
});

useEffect(() => {
  localStorage.setItem('skiller_cart', JSON.stringify(cart));
}, [cart]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [view, setView] = useState<'home' | 'checkout' | 'admin' | 'auth' | 'track-order' | 'success'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'default'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  
  // NEW: Track if they have passed the Hero section
  const [hasSeenHero, setHasSeenHero] = useState(false);

  const toastTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [showCartToast, setShowCartToast] = useState<Product | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'wishlist' | 'settings'>('profile');

  const sync = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState({ view }, '', `#${view}`);
    
    // Automatically skip the hero image if we navigate away from 'home'
    if (view !== 'home') {
      setHasSeenHero(true);
    }
    
    const handlePopState = (e: any) => {
      if (e.state && e.state.view) {
        setView(e.state.view);
        setIsProfileOpen(false);
        setIsCartOpen(false);
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedProduct]);

  const prevOrdersRef = useRef<any[]>([]);
    
  const checkBackendSync = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) { setIsSynced(false); return; }
      setIsSynced(true);

      setIsLoadingProducts(true); 
      fetch(`${API_BASE}/products`)
        .then(r => r.json())
        .then(data => setProducts(data.map((p: any) => ({ ...p, id: p._id }))))
        .catch(e => console.log("Product sync delayed"))
        .finally(() => setIsLoadingProducts(false)); 

      const token = localStorage.getItem('faith_token');
      if (!token || token === 'undefined' || token === 'null') {
         if (currentUser) {
            setCurrentUser(null);
            localStorage.removeItem('faith_session_active');
         }
         return;
      }

      const session = localStorage.getItem('faith_session_active');
      const localUser = session ? JSON.parse(session) : null;
      
      const isAdmin = localUser?.role === 'admin' || localUser?.email === 'skiller@skiller';

      const orderEndpoint = isAdmin ? '/orders' : '/orders/my';
      fetch(`${API_BASE}${orderEndpoint}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => {
           if (r.status === 401 || r.status === 403) {
              localStorage.removeItem('faith_token');
              localStorage.removeItem('faith_session_active');
              setCurrentUser(null);
              setView('home');
              throw new Error('Auth Expired');
           }
           return r.ok ? r.json() :[];
        })
        .then(data => {
          if (!isAdmin && prevOrdersRef.current.length > 0) {
              data.forEach((newOrder: any) => {
                const oldOrder = prevOrdersRef.current.find(o => (o.id === newOrder._id || o._id === newOrder._id));
                if (oldOrder && oldOrder.status !== 'Delivered' && newOrder.status === 'Delivered') {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                  audio.play().catch(()=>{});
                  showToast(`Order #${(newOrder._id || newOrder.id).slice(-6)} has been Delivered!`, 'success');
                }
              });
          }
          prevOrdersRef.current = data;
          setOrders(data);
        })
        .catch(e => console.log("Order sync delayed"));

      if (isAdmin) {
        fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => {
             if (r.status === 401) {
                localStorage.removeItem('faith_token');
                localStorage.removeItem('faith_session_active');
                setCurrentUser(null);
                setView('home');
                throw new Error('Auth Expired');
             }
             return r.ok ? r.json() :[];
          })
          .then(data => {
              setUsers(Array.isArray(data) ? data.map((u: any) => ({ ...u, id: u._id || u.id })) :[]);
          })
          .catch(e => console.log("User sync delayed"));
      }
    } catch (e) {
      setIsSynced(false);
    }
  };
  const handleAuth = (user: User, token?: string) => {
    const normalizedUser = { 
      ...user, 
      id: (user as any)._id || user.id 
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem("faith_session_active", JSON.stringify(normalizedUser));
    if (token) localStorage.setItem("faith_token", token);
    setView("home");
    checkBackendSync();
  };

  const filteredProducts = useMemo(() => {
    let result = [...(products || [])];

    if (debouncedSearch) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    // Apply Price Range for Search View
    if (view === 'search') {
      result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    }

    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Hot Deals') {
        result = result.filter(p => p.category === 'Hot Deals' || p.isHot === true);
      } else {
        result = result.filter(p => p.category === selectedCategory || p.category?.startsWith(`${selectedCategory} -`));
      }
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [products, selectedCategory, sortBy, debouncedSearch]);

  const [sessionStartTime] = useState(() => Number(localStorage.getItem('faith_last_visit')) || (Date.now() - 86400000));
  
  // Cut down HERO IMAGES array for performance if needed
  const displayHeroes = HERO_IMAGES.slice(0, 4);

  useEffect(() => {
    const visitTimer = setTimeout(() => localStorage.setItem('faith_last_visit', Date.now().toString()), 5000);
    const session = localStorage.getItem('faith_session_active');
    if (session) setCurrentUser(JSON.parse(session));

    localStorage.removeItem('faith_products_db');
    localStorage.removeItem('faith_orders_db');
    localStorage.removeItem('faith_users_db');

    setProducts(INITIAL_PRODUCTS);
    
    // Only cycle hero index if user hasn't skipped it to save resources
    const interval = setInterval(() => {
      if (!hasSeenHero) {
        setHeroIdx(prev => (prev + 1) % displayHeroes.length);
      }
    }, 6000);

    checkBackendSync();
    const syncInterval = setInterval(() => {
      checkBackendSync();
    }, 240000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      clearTimeout(visitTimer);
    };
  }, [hasSeenHero, displayHeroes.length]);

  const wishlistProducts = useMemo(() => {
    if (!currentUser || !currentUser.wishlist) return [];
    return products.filter(p => currentUser.wishlist.includes(p.id));
  }, [products, currentUser]);

  const toggleWishlist = async (productId: string) => {
    if (!currentUser) return setView('auth');
    
    let nextW = currentUser.wishlist || [];
    nextW = nextW.includes(productId) ? nextW.filter(id => id !== productId) : [...nextW, productId];
    const nextU = { ...currentUser, wishlist: nextW };
    
    setCurrentUser(nextU);
    localStorage.setItem('faith_session_active', JSON.stringify(nextU));

    try {
      await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
        },
        body: JSON.stringify({ wishlist: nextW })
      });
    } catch (e) {
      console.error("Failed to sync wishlist to server");
    }
  };

  const handleAddToCart = (p: Product) => {
    if (p.stock < 1) return showToast("Out of stock.", "error");
    
    setCart(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex && ex.quantity >= p.stock) {
            showToast(`Only ${p.stock} units available in pool.`, "error");
            return prev;
        }
        return ex ? prev.map(i => i.id === p.id ? {...i, quantity: i.quantity + 1} : i) : [...prev, {...p, quantity: 1}];
    });
    
    setShowCartToast(p);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShowCartToast(null), 3000);
  };

  const handleOrderUpdate = async (id: string, data: Partial<Order>) => {
    const next = orders.map((o: any) => (o._id === id || o.id === id) ? { ...o, ...data } : o);
    setOrders(next);
    sync('faith_orders_db', next);

    try {
      await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
        },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.log("Failed to sync order update to server");
    }
  };

  const handleAddReview = async (productId: string, review: Review) => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
        },
        body: JSON.stringify({ rating: review.rating, comment: review.comment, userName: review.userName, userProfilePic: review.userProfilePic })
      });
      
      if (res.ok) {
        const updatedProduct = await res.json();
        const nextProducts = products.map(p => p.id === productId ? { ...updatedProduct, id: updatedProduct._id } : p);
        setProducts(nextProducts);
        
        if (selectedProduct && selectedProduct.id === productId) {
           setSelectedProduct({ ...updatedProduct, id: updatedProduct._id });
        }
      } else {
        showToast("Failed to submit comment to Sanctuary.", "error");
      }
    } catch (e) {
      console.error("Review error:", e);
    }
  };

  const handleBulkUpdate = async (type: string, id?: string, amount?: any) => {
    if (type === 'edit' && id && amount) {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
          },
          body: JSON.stringify(amount) 
        });
        
        if (res.ok) {
          const updatedProduct = await res.json();
          setProducts(products.map(p => p.id === id ? { ...updatedProduct, id: updatedProduct._id } : p));
        } else {
          showToast("Failed to update entity on server.", "error");
        }
      } catch (e) {
        console.error("Product update failed");
      }
    }
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark text-slate-100 bg-slate-950' : 'text-slate-900 bg-slate-50'}`}>
      <Navbar 
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        setView={(v) => {
          setView(v);
          if(v !== 'home') setHasSeenHero(true);
        }} 
        activeView={view}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        currentUser={currentUser} onOpenProfile={() => setIsProfileOpen(true)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        products={products}
        isSynced={isSynced}
      />
      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showCartToast && <CartToast product={showCartToast} onClose={() => setShowCartToast(null)} />}

      <main className="flex-1">
        {view === 'home' && (
          <div>
            {!hasSeenHero ? (
              <section className="relative h-[90vh] bg-slate-950 flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(225,29,72,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(225,29,72,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
                 
                 <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-rose-600/20 rounded-full blur-[80px] md:blur-[120px] mix-blend-screen pointer-events-none animate-pulse"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-600/20 rounded-full blur-[80px] md:blur-[120px] mix-blend-screen pointer-events-none"></div>

                 {displayHeroes.map((img, i) => (
                   <img 
                     key={i} 
                     src={img} 
                     className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${heroIdx === i ? 'opacity-30' : 'opacity-0'}`} 
                     style={{ willChange: 'opacity' }}
                   />
                 ))}
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80"></div>
                 
                 <div className="relative text-center text-white px-4 md:px-6 animate-future-in z-10 backdrop-blur-sm py-10 px-6 md:p-12 rounded-[40px] md:rounded-[64px] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-[90vw] md:max-w-none">
                    <span className="px-4 md:px-6 py-2 bg-rose-600/10 backdrop-blur-md rounded-full font-mono text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] border border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center gap-2 w-max mx-auto mb-6 md:mb-8">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-500 animate-pulse"></span> System Online
                    </span>
                    <h1 className="text-5xl md:text-[8rem] font-serif italic font-bold mb-4 md:mb-8 leading-none drop-shadow-[0_0_20px_rgba(225,29,72,0.3)]">Presence <br/> <span className="text-rose-500">By Skiller.</span></h1>
                    <p className="text-sm md:text-xl max-w-2xl mx-auto font-mono text-slate-400 mb-10 md:mb-16 tracking-widest text-[9px] md:text-[10px] uppercase">Shop the Nairobi Collection</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                      <button onClick={() => setHasSeenHero(true)} className="w-full md:w-auto px-8 md:px-16 py-5 md:py-6 bg-white text-slate-900 rounded-[20px] md:rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] hover:bg-rose-600 hover:text-white transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] active:scale-95">
                        View Store
                      </button>
                      <button onClick={() => { setHasSeenHero(true); setView('track-order'); }} className="w-full md:w-auto px-8 md:px-12 py-5 md:py-6 bg-transparent text-white border-2 border-white/10 rounded-[20px] md:rounded-full font-mono font-bold uppercase tracking-[0.2em] text-[10px] md:text-[11px] hover:bg-white/5 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Terminal className="w-4 h-4"/> Track Order
                      </button>
                    </div>
                 </div>
              </section>
            ) : (
              <section id="shop" className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-32 pb-20 md:pb-32 space-y-8 md:space-y-16 animate-fade-in">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10">
                    <div className="space-y-2 md:space-y-4">
                      <h2 className="text-4xl md:text-6xl font-serif italic font-bold text-slate-900 dark:text-white">{selectedCategory}</h2>
                      <div className="h-1.5 w-16 md:w-24 bg-rose-500 rounded-full shadow-lg"></div>
                    </div>
                    <div className="w-full md:w-auto flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-2 md:p-3 rounded-2xl md:rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex flex-1 md:flex-none items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl md:rounded-full shadow-sm text-slate-400 relative">
                        <ArrowUpDown className="w-4 h-4 shrink-0" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none bg-transparent dark:text-white appearance-none pr-6">
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value="default">Sort: Default</option>
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value="price-asc">Price: Low to High</option>
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value="price-desc">Price: High to Low</option>
                          <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value="rating">Top Rated</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </div>
                 </div>
                 
                 {/* RESPONSIVE MOBILE PRODUCT GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {isLoadingProducts ? (
                      [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <div key={p.id} className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[24px] md:rounded-[48px] border border-slate-100/50 dark:border-white/5 shadow-sm hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] transition-all duration-300 flex flex-col cursor-pointer p-3 md:p-5 overflow-hidden" onClick={() => setSelectedProduct(p)}>
                           <div className="aspect-[3/4] rounded-[16px] md:rounded-[40px] overflow-hidden mb-4 md:mb-8 relative shadow-sm md:shadow-lg">
                              
                              <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10 flex flex-col gap-1 md:gap-2 items-start">
                                {(Date.now() - new Date(p.createdAt || p.date || Date.now()).getTime() < 86400000) && (
                                  <div className="px-2 md:px-4 py-1 md:py-2 bg-emerald-500/90 backdrop-blur-md text-white font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                                      New
                                  </div>
                                )}
                                {p.isHot && (
                                  <div className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-mono text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(249,115,22,0.8)] flex items-center gap-1 md:gap-2 animate-pulse border border-orange-300/50">
                                      <span className="text-xs md:text-sm drop-shadow-md">🔥</span> <span className="hidden sm:block drop-shadow-md">Hot Deal</span>
                                  </div>
                                )}
                              </div>
                              <img src={p.image} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ willChange: 'transform' }} />
                              
                              <div className="absolute top-2 right-2 md:top-6 md:right-6 flex flex-col gap-2 z-20">
                                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className={`p-2.5 md:p-4 rounded-full backdrop-blur-md transition-all border border-white/10 ${currentUser?.wishlist?.includes(p.id) ? 'bg-rose-500/90 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]' : 'bg-slate-900/80 text-white opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-rose-500/50'}`}>
                                  <Heart className={`w-3.5 h-3.5 md:w-5 md:h-5 ${currentUser?.wishlist?.includes(p.id) ? 'fill-current' : ''}`} />
                                </button>
                              </div>

                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
                                 <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }} className="px-8 py-3 bg-white/90 backdrop-blur text-slate-900 rounded-full font-mono font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)] active-scale flex items-center gap-2">
                                   <Terminal className="w-4 h-4" /> Quick View
                                 </button>
                              </div>
                            </div>
                            <div className="px-2 md:px-4 pb-2 md:pb-4 flex-1 flex flex-col text-center">
                              <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-rose-500 mb-2 md:mb-3 truncate">{p.category}</p>
                              <h3 className="text-xs md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-6 line-clamp-2 md:line-clamp-1 h-8 md:h-auto leading-tight">{p.name}</h3>
                              <div className="mt-auto flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-3 md:pt-6">
                                <span className="text-sm md:text-xl font-mono font-bold text-slate-900 dark:text-white truncate pr-2">Ksh {p.price.toLocaleString()}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-8 h-8 md:w-14 md:h-14 bg-slate-900 dark:bg-rose-600 text-white rounded-[12px] md:rounded-[24px] flex items-center justify-center hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-90 shrink-0">
                                  <Plus className="w-4 h-4 md:w-6 md:h-6" />
                                </button>
                              </div>
                            </div>
                        </div>
                      ))
                    ) : null}
                 </div>
                 
                 {!isLoadingProducts && filteredProducts.length === 0 && (
                   <div className="text-center py-20 md:py-40 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] md:rounded-[64px] italic text-slate-500 text-sm md:text-base border border-slate-100 dark:border-white/5">
                     No entities detected matching this search result.
                   </div>
                 )}
              </section>
            )}
          </div>
        )}

        {/* --- DEDICATED SEARCH VIEW --- */}
        {view === 'search' && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 space-y-8 animate-fade-in min-h-[80vh]">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Filter Sidebar */}
              <div className="w-full lg:w-80 bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 shrink-0 lg:sticky lg:top-28">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/5 pb-4">
                   <button onClick={() => { setSearchQuery(''); setView('home'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4"/> Back</button>
                   <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Price Range (Ksh)</label>
                    <div className="flex items-center gap-4 mb-4">
                      <input type="number" value={priceRange.min} onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value)}))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none border border-transparent focus:border-rose-300" placeholder="Min" />
                      <span className="text-slate-400">-</span>
                      <input type="number" value={priceRange.max} onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value)}))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none border border-transparent focus:border-rose-300" placeholder="Max" />
                    </div>
                    {/* Visual Slider */}
                    <input 
                      type="range" min="0" max="200000" step="1000" 
                      value={priceRange.max} 
                      onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value)}))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Sort Options</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none appearance-none border border-transparent focus:border-rose-300 cursor-pointer">
                      <option value="default">Relevance</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Area */}
              <div className="flex-1 w-full">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-5xl font-serif italic font-bold text-slate-900 dark:text-white mb-2">
                    Search Results for "{searchQuery}"
                  </h2>
                  <p className="font-mono text-xs text-rose-500 font-bold uppercase tracking-widest">{filteredProducts.length} Items Found</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[24px] md:rounded-[48px] border border-slate-100/50 dark:border-white/5 shadow-sm hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] transition-all duration-300 flex flex-col cursor-pointer p-3 md:p-5 overflow-hidden" onClick={() => setSelectedProduct(p)}>
                           <div className="aspect-[3/4] rounded-[16px] md:rounded-[40px] overflow-hidden mb-4 md:mb-8 relative shadow-sm md:shadow-lg">
                              <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10 flex flex-col gap-1 md:gap-2 items-start">
                                {p.isHot && (
                                  <div className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-mono text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(249,115,22,0.8)] flex items-center gap-1 md:gap-2 animate-pulse border border-orange-300/50">
                                      <span className="text-xs md:text-sm drop-shadow-md">🔥</span> <span className="hidden sm:block drop-shadow-md">Hot Deal</span>
                                  </div>
                                )}
                              </div>
                              <img src={p.image} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ willChange: 'transform' }} />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
                                 <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }} className="px-8 py-3 bg-white/90 backdrop-blur text-slate-900 rounded-full font-mono font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)] active-scale flex items-center gap-2">
                                   <Terminal className="w-4 h-4" /> Quick View
                                 </button>
                              </div>
                            </div>
                            <div className="px-2 md:px-4 pb-2 md:pb-4 flex-1 flex flex-col text-center">
                              <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-rose-500 mb-2 md:mb-3 truncate">{p.category}</p>
                              <h3 className="text-xs md:text-xl font-bold text-slate-900 dark:text-white mb-3 md:mb-6 line-clamp-2 md:line-clamp-1 h-8 md:h-auto leading-tight">{p.name}</h3>
                              <div className="mt-auto flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-3 md:pt-6">
                                <span className="text-sm md:text-xl font-mono font-bold text-slate-900 dark:text-white truncate pr-2">Ksh {p.price.toLocaleString()}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="w-8 h-8 md:w-14 md:h-14 bg-slate-900 dark:bg-rose-600 text-white rounded-[12px] md:rounded-[24px] flex items-center justify-center hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-90 shrink-0">
                                  <Plus className="w-4 h-4 md:w-6 md:h-6" />
                                </button>
                              </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-2 md:col-span-3 text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] italic text-slate-500 border border-slate-100 dark:border-white/5">
                        No matches found for your filter configuration.
                      </div>
                    )}
                </div>
              </div>
            </div>
          </section>
        )}

{/* --- ADMIN VIEW --- */}
        {view === 'admin' && (
          <AdminVault 
            currentUser={currentUser}
            products={products} 
            orders={orders} 
            users={users}
            onAdd={async (p: any) => {
              // Connect to MongoDB: POST /api/products (You'll need this route in server.js)
              const res = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
                },
                body: JSON.stringify(p)
              });
              if(res.ok) {
                const newProd = await res.json();
                setProducts([...products, { ...newProd, id: newProd._id }]);
              }
            }}
            onDelete={async (id: any) => {
              const res = await fetch(`${API_BASE}/products/${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('faith_token')}` }
              });
              if(res.ok) setProducts(products.filter(p => p.id !== id));
            }}
onUpdateUser={async (id: any, data: any) => {
              try {
                const res = await fetch(`${API_BASE}/users/${id}`, { 
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
                  },
                  body: JSON.stringify(data)
                });
                if(res.ok) {
                   setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, ...data } : u));
                } else {
                   
                  showToast("Failed to update user role on server.", "error");
                }
              } catch (e) {
                console.log(e);
              }
            }}
            onDeleteUser={async (id: any) => {
              if(!window.confirm("Are you sure you want to permanently banish this citizen?")) return;
              try {
                const res = await fetch(`${API_BASE}/users/${id}`, { 
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('faith_token')}` }
                });
                if(res.ok) {
                  setUsers(users.filter(u => u.id !== id && u._id !== id));
                } else {
                
                  showToast("Failed to delete user on server.", "error");
                }
              } catch (e) {
                console.log(e);
              }
            }}
            onUpdateOrder={handleOrderUpdate}
            onBulkUpdate={handleBulkUpdate}
          />
        )}
        
        {/* --- ORDER TRACKING --- */}
        {view === 'track-order' && <TrackOrderView orders={orders} currentUser={currentUser} />}
        
        {/* --- AUTHENTICATION --- */}
        {view === 'auth' && <AuthView onAuthSuccess={handleAuth} showToast={showToast} />}
        
        {/* --- CHECKOUT PROTOCOL --- */}
        {view === 'checkout' && (
          <CheckoutView 
            cart={cart} 
            currentUser={currentUser}
            showToast={showToast}
            onComplete={async (o: any) => { 
              // 1. We no longer save to localStorage mock DBs here.
              // 2. Format the order for MongoDB
              const formattedOrder = {
                phoneNumber: o.phoneNumber,
                total: o.total,
                userName: currentUser.name,                 // <-- Added
                deliveryMethod: o.shippingMethod,
                deliveryDays: o.deliveryDays,               // <-- Added real delivery days
                userProfilePic: currentUser.profilePic,
                address: currentUser.address,// <-- Renamed to match schema
                items: o.items.map((item: any) => ({
                  productId: item.id || item._id, 
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  image: item.image, // Saving image to database
                })),
              };

              try {
                const token = localStorage.getItem("faith_token");
                const res = await fetch(`${API_BASE}/orders`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                  body: JSON.stringify(formattedOrder),
                });

                if (res.ok) {
                  const savedOrder = await res.json();
                  // 1. Use functional state update to prevent stale data closure
                  setOrders(prev => [savedOrder, ...prev]);
                  
                  // 2. Immediately decrement local stock AND send PUT requests to database to update pool
                  setProducts(prevProducts => prevProducts.map(p => {
                    const boughtItem = o.items.find((i: any) => (i.id || i._id) === p.id);
                    if (boughtItem) {
                       const newStock = Math.max(0, p.stock - boughtItem.quantity);
                       // Update database stock asynchronously
                       fetch(`${API_BASE}/products/${p.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ stock: newStock })
                       }).catch(e => console.error("Database stock sync failed"));
                       return { ...p, stock: newStock };
                    }
                    return p;
                  }));
                  
                  setCart([]); 
                  setView('success'); 
                } else {
                
                  showToast("Order processing failed on server.", "error");
                }
              } catch (e) {
               
                showToast("Network error: Could not transmit order.", "error");
              }
            }} 
            onAuth={() => {
               setView('home'); 
               setActiveProfileTab('settings'); // We defined this state in Step 1
               setIsProfileOpen(true); 
            }}
          />
        )}

        {/* --- SUCCESS STATE (FIXED CONTRAST) --- */}
        {view === 'success' && (
          <div className="pt-64 pb-64 text-center animate-future-in bg-white dark:bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
             <CyberMatrixRain />
             <div className="rotating-border-container mx-auto w-40 h-40 mb-14 flex items-center justify-center relative z-10">
                <CheckCircle2 className="w-20 h-20 text-emerald-500 relative z-10 drop-shadow-neon" />
             </div>
             <h1 className="text-8xl font-serif italic font-bold mb-8 text-rose-600">Sync Success.</h1>
             {/* Changed text-slate-400 to text-slate-900 for light mode visibility */}
             <p className="text-2xl text-slate-900 dark:text-slate-300 mb-16 font-light italic">Order protocol verified. ID Trace Active.</p>
             <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button onClick={() => setView('track-order')} className="px-12 py-6 bg-slate-900 dark:bg-rose-600 text-white rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-2xl active-scale flex items-center gap-3">
                  <Truck className="w-4 h-4" /> Trace Order Logistics
                </button>
                <button onClick={() => setView('home')} className="px-12 py-6 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-[32px] font-black uppercase tracking-widest text-[11px] active-scale">
                  Return to Sanctuary
                </button>
             </div>
          </div>
        )}

      </main> 
      
      <Footer />

      {/* --- DRAWER & MODALS --- */}
      {isCartOpen && (
        <CartDrawer 
          cart={cart} 
          setCart={setCart} 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={() => { setIsCartOpen(false); setView('checkout'); }} 
        />
      )}

      {isProfileOpen && currentUser && (
        <ProfileModal 
          user={currentUser}
          orders={orders}
          activeTab={activeProfileTab}
          setActiveTab={setActiveProfileTab}
          onClose={() => setIsProfileOpen(false)}  
          onLogout={() => {
            setCurrentUser(null);
            localStorage.removeItem("faith_session_active");
            localStorage.removeItem("faith_token");
            setView("home");
            setIsProfileOpen(false);
          }}
          wishlistProducts={wishlistProducts} 
          onRemoveFromWishlist={toggleWishlist} 
          onAddToCart={handleAddToCart}
          onUpdateUser={async (id: any, data: any) => { 
            try {
              const res = await fetch(`${API_BASE}/users/${id}`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('faith_token')}`
                },
                body: JSON.stringify(data)
              });
              if(res.ok) {
                const updatedUser = await res.json();
                const nextU = { ...currentUser, ...updatedUser, id: updatedUser._id };
                setCurrentUser(nextU);
                localStorage.setItem("faith_session_active", JSON.stringify(nextU)); 
              } else {

                showToast("Failed to sync profile changes.", "error");
              }
            } catch (e) {
              console.error(e);
            }
          }}

        />
      )}

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          isWishlisted={currentUser?.wishlist?.includes(selectedProduct.id)} 
          onToggleWishlist={toggleWishlist} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart} 
          onAddReview={handleAddReview} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
};

// --- Sub Components ---


const ProfileModal = ({ user, orders, onClose, onLogout, wishlistProducts, onRemoveFromWishlist, onAddToCart, onUpdateUser, activeTab, setActiveTab }: any) => {
  const [showPicOptions, setShowPicOptions] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editData, setEditData] = useState({ 
    name: user.name,
    email: user.email, 
    phoneNumber: user.phoneNumber || '', 
    address: user.address || '', 
    profilePic: user.profilePic || '',
    password: '' 
  });

  const [showMenuOnMobile, setShowMenuOnMobile] = useState(true);

  const handleTabSwitch = (tab: any) => {
    setActiveTab(tab);
    setShowMenuOnMobile(false); 
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 lg:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      
      {viewingImage && (         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" onClick={() => setViewingImage(null)}>           <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-6 h-6" /></button>           <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />         </div>       )}        <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl lg:max-w-5xl bg-white dark:bg-slate-900 md:rounded-[48px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-white/10">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-[100] p-3 bg-slate-100 dark:bg-slate-800/80 backdrop-blur-md rounded-full transition-all hover:bg-rose-500 hover:text-white shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SIDEBAR */}
        <aside className={`w-full md:w-64 lg:w-80 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 lg:p-10 flex-col shrink-0 overflow-y-auto border-r border-slate-200 dark:border-white/5 ${showMenuOnMobile ? 'flex' : 'hidden md:flex'}`}>
          <div className="text-center mb-8 mt-8 md:mt-0">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="rotating-border-container w-full h-full relative group cursor-pointer" onClick={() => setShowPicOptions(!showPicOptions)}>
                <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                  {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" /> : <div className="font-black text-3xl">{user.name.charAt(0)}</div>}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 text-white transition-opacity"><Camera className="w-6 h-6"/></div>
                </div>
              </div>
              
              {showPicOptions && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[60] animate-fade-in">
                  {user.profilePic && (
                    <button onClick={() => { setShowPicOptions(false); setViewingImage(user.profilePic); }} className="block w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">View Image</button>
                  )}
                  <label className="block w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    Upload from Device
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      setShowPicOptions(false);
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadToCloudinary(file);
                        if (url) onUpdateUser(user.id || user._id, { profilePic: url });
                      }
                    }}/>
                  </label>
                  <button onClick={() => {
                    setShowPicOptions(false);
                    const randomId = Math.floor(Math.random() * 1000) + 1;
                    onUpdateUser(user.id || user._id, { profilePic: `https://picsum.photos/id/${randomId}/400/400` });
                  }} className="block w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700">
                    Generate Random Avatar
                  </button>
                </div>
              )}
            </div>
             <h3 className="text-xl font-serif italic font-bold text-slate-900 dark:text-white truncate px-2">{user.name}</h3>
             <p className="text-[9px] font-mono uppercase text-rose-500 mt-2 tracking-widest">{user.role}</p>
          </div>
          
          <nav className="space-y-2 flex-1">
             <button onClick={() => handleTabSwitch('profile')} className={`w-full text-left px-5 lg:px-6 py-4 rounded-[20px] font-mono font-bold uppercase text-[10px] flex items-center gap-4 transition-all ${activeTab === 'profile' ? 'bg-rose-600 text-white shadow-neon' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}><Activity className="w-4 h-4 shrink-0" /> <span className="truncate">Dashboard</span></button>
            <button onClick={() => handleTabSwitch('orders')} className={`w-full text-left px-5 lg:px-6 py-4 rounded-[20px] font-mono font-bold uppercase text-[10px] flex items-center gap-4 transition-all ${activeTab === 'orders' ? 'bg-rose-600 text-white shadow-neon' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}><Package className="w-4 h-4 shrink-0" /> <span className="truncate">My Orders</span></button>
             <button onClick={() => handleTabSwitch('wishlist')} className={`w-full text-left px-5 lg:px-6 py-4 rounded-[20px] font-mono font-bold uppercase text-[10px] flex items-center gap-4 transition-all ${activeTab === 'wishlist' ? 'bg-rose-600 text-white shadow-neon' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}><Heart className="w-4 h-4 shrink-0" /> <span className="truncate">Favorites</span></button>
             <button onClick={() => handleTabSwitch('settings')} className={`w-full text-left px-5 lg:px-6 py-4 rounded-[20px] font-mono font-bold uppercase text-[10px] flex items-center gap-4 transition-all ${activeTab === 'settings' ? 'bg-rose-600 text-white shadow-neon' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}><Settings className="w-4 h-4 shrink-0" /> <span className="truncate">Settings</span></button>
          </nav>
          <button onClick={onLogout} className="mt-6 py-4 w-full border border-rose-500/30 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl font-mono font-bold uppercase text-[10px] flex items-center justify-center gap-3 transition-all"><LogOut className="w-4 h-4 shrink-0" /> Log Out</button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className={`flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto scrollbar-hide relative min-w-0 ${!showMenuOnMobile ? 'block' : 'hidden md:block'}`}>
          {!showMenuOnMobile && (
             <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md pb-4 pt-2 -mt-2 -mx-2 px-2">
               <button onClick={() => setShowMenuOnMobile(true)} className="md:hidden flex items-center gap-2 text-rose-500 font-mono text-[10px] font-bold uppercase bg-rose-500/10 px-4 py-2 rounded-full w-max shadow-sm">
                 <ArrowLeft className="w-4 h-4"/> Back to Menu
               </button>
             </div>
          )}
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif italic font-bold text-slate-900 dark:text-white mb-8 md:mb-12 pr-16 md:pr-20 mt-2 md:mt-0 truncate">
            {activeTab === 'profile' && 'Overview'}
            {activeTab === 'wishlist' && 'Luxury Favorites'}
            {activeTab === 'settings' && 'Identity Control'}
            {activeTab === 'orders' && 'Orders Hub'}
          </h2>
          
          {activeTab === 'profile' && (
            <div className="space-y-6 md:space-y-10 animate-fade-in">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
  {/* NEW: VIP Status Card */}
  <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/20 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-amber-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
    <Crown className="absolute top-4 right-4 w-6 h-6 text-amber-500/30" />
    <p className="text-[9px] md:text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-2 md:mb-4 tracking-widest">Skiller Points</p>
    <div className="flex items-center gap-2 md:gap-3">
       <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-500 shrink-0" />
       <span className="text-2xl md:text-3xl font-black italic text-slate-900 dark:text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
         {user.faithPoints || 0}
       </span>
    </div>
  </div>

  <div className="bg-slate-100 dark:bg-slate-800/50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center overflow-hidden">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 md:mb-4 tracking-widest">My Spend</p>
                    <div className="flex items-center gap-1 md:gap-3 max-w-full">
                       <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 shrink-0" />
                       <span className="text-lg sm:text-xl lg:text-2xl font-black italic text-slate-900 dark:text-white truncate min-w-0" title={`Ksh ${orders.filter((o:any) => o.userId === (user.id || user._id) && o.status !== 'Cancelled').reduce((sum:number, o:any) => sum + (o.total || 0), 0).toLocaleString()}`}>
                         Ksh {orders.filter((o:any) => o.userId === (user.id || user._id) && o.status !== 'Cancelled').reduce((sum:number, o:any) => sum + (o.total || 0), 0).toLocaleString()}
                       </span>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 md:mb-4 tracking-widest">Favorites</p>
                    <div className="flex items-center gap-2 md:gap-3">
                       <Heart className="w-8 h-8 md:w-10 md:h-10 text-rose-500" />
                       <span className="text-2xl md:text-3xl font-black italic text-slate-900 dark:text-white">{wishlistProducts.length}</span>
                    </div>
                  </div>
               </div>
               <div className="bg-rose-50 dark:bg-rose-900/10 p-6 md:p-10 lg:p-12 rounded-[32px] md:rounded-[48px] lg:rounded-[56px] border border-rose-100 dark:border-rose-900/30">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-600 shadow-xl border border-rose-100 dark:border-rose-900/50 shrink-0"><History className="w-8 h-8 md:w-10 md:h-10" /></div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Active Since</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">{new Date(user.joinedAt).toLocaleDateString()} — Identity Verified</p>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Full Name</label>
                     <input className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Email Address</label>
                     <input className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Phone Number</label>
                     <input className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" placeholder="07XX XXX XXX" value={editData.phoneNumber} onChange={e => setEditData({...editData, phoneNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Profile Photo Link</label>
                     <input className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" placeholder="URL to Image" value={editData.profilePic} onChange={e => setEditData({...editData, profilePic: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Change Password</label>
                  <input type="password" className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" placeholder="Leave blank to keep current password" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-4">Delivery Address</label>
                  <input className="w-full p-4 md:p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] font-bold outline-none border-2 border-transparent focus:border-rose-300 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" placeholder="Apartment, Street, City" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
               </div>
               <button onClick={() => { 
                  onUpdateUser(user.id || user._id, editData); 
                  onClose(); 
               }} className="w-full py-6 md:py-8 bg-slate-900 dark:bg-rose-600 text-white rounded-3xl md:rounded-[40px] font-black uppercase tracking-widest text-[10px] md:text-[12px] shadow-2xl hover:bg-rose-700 transition-all active:scale-95 mt-6 md:mt-10">
                  Save Profile
               </button>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in pb-10">
               {wishlistProducts.length === 0 ? <div className="text-center py-20 text-slate-400 italic text-xl md:text-2xl border border-dashed border-slate-200 dark:border-white/5 rounded-[32px]">Sanctuary is empty.</div> : (
                 wishlistProducts.map((p: Product) => (
                   <div key={p.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 group bg-slate-50 dark:bg-slate-800/30 p-5 md:p-6 lg:p-8 rounded-[32px] md:rounded-[40px] hover:bg-rose-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-transparent hover:border-rose-100">
                      <img src={p.image} className="w-full sm:w-24 h-48 sm:h-32 rounded-[24px] object-cover shadow-xl sm:group-hover:scale-110 transition-transform duration-700 shrink-0" />
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h4 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{p.name}</h4>
                        <p className="text-sm font-black italic text-rose-600 mt-2 tracking-widest truncate">Ksh {p.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <button onClick={() => onAddToCart(p)} className="flex-1 sm:flex-none p-4 md:p-5 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl md:rounded-[20px] hover:bg-rose-700 transition-all shadow-xl active:scale-90 flex justify-center"><ShoppingBag className="w-5 h-5" /></button>
                        <button onClick={() => onRemoveFromWishlist(p.id)} className="flex-1 sm:flex-none p-4 md:p-5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-2xl md:rounded-[20px] shadow-md transition-all active:scale-90 flex justify-center"><Trash2 className="w-5 h-5" /></button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in pb-10">
              <div className="w-full overflow-x-hidden">
                <TrackOrderView orders={orders} currentUser={user} isModal={true} />
              </div>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
};

     const Footer = () => (
  <footer className="bg-slate-900 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12 px-6 mt-20 border-t border-slate-200 dark:border-white/10 relative overflow-hidden transition-colors">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(225,29,72,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(225,29,72,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
    
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
      <div className="space-y-6">
        <h2 className="text-4xl font-serif font-bold italic text-rose-600 drop-shadow-neon">Skiller.</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-mono leading-relaxed">
          Premium Nairobi fashion for the modern visionary. Initializing luxury protocols all over Kenya.
        </p>
        <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Servers Online
        </div>
      </div>
      
      <div>
        <h4 className="font-mono font-bold uppercase tracking-widest text-[11px] mb-6 text-slate-900 dark:text-white">Sanctuary Links</h4>
        <div className="space-y-4 text-sm font-mono text-slate-500 dark:text-slate-400">
          <p className="hover:text-rose-500 cursor-pointer flex items-center gap-2 transition-colors"><ChevronRight className="w-3 h-3"/> Order Tracking</p>
          <p className="hover:text-rose-500 cursor-pointer flex items-center gap-2 transition-colors"><ChevronRight className="w-3 h-3"/> Return Policy</p>
          <p className="hover:text-rose-500 cursor-pointer flex items-center gap-2 transition-colors"><ChevronRight className="w-3 h-3"/> Privacy Protocol</p>
          <p className="hover:text-rose-500 cursor-pointer flex items-center gap-2 transition-colors"><ChevronRight className="w-3 h-3"/> Delivery Addresses</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-mono font-bold uppercase tracking-widest text-[11px] mb-6 text-slate-900 dark:text-white">Comm Channels</h4>
        <div className="space-y-4 text-sm font-mono text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-3"><Mail className="w-4 h-4 text-rose-500"/> support@skiller.com</p>
          <p className="flex items-center gap-3"><Smartphone className="w-4 h-4 text-rose-500"/> +254 757 808 788</p>
          <p className="flex items-center gap-3"><MapPin className="w-4 h-4 text-rose-500"/> Nairobi, Kenya</p>
        </div>
      </div>

      <div>
        <h4 className="font-mono font-bold uppercase tracking-widest text-[11px] mb-6 text-slate-900 dark:text-white">Network</h4>
        <div className="flex gap-4">
          <a href="#" className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:-translate-y-2 hover:shadow-neon transition-all duration-300"><Github className="w-5 h-5" /></a>
          <a href="http://www.youtube.com/@samskiller4" target="_blank" className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:-translate-y-2 hover:shadow-neon transition-all duration-300"><Youtube className="w-5 h-5" /></a>
          <a href="#" className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:-translate-y-2 hover:shadow-neon transition-all duration-300"><Globe className="w-5 h-5" /></a>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col items-center justify-center relative">
      <a 
        href="http://www.youtube.com/@samskiller4" 
        target="_blank"
        className="group relative px-10 py-5 bg-transparent overflow-hidden rounded-full font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-110 active:scale-90 border border-slate-200 dark:border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-purple-600 to-sky-600 opacity-0 group-hover:opacity-100 group-hover:animate-gradient-x transition-all duration-700"></div>
        <span className="relative z-10 text-slate-900 dark:text-white group-hover:text-white drop-shadow-lg flex items-center gap-3 transition-colors">
          Developed By SKILLER <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
        </span>
      </a>
      <p className="mt-8 font-mono text-[9px] text-slate-400 uppercase tracking-widest text-center">© 2026 Skiller Shop. All Protocols Monitored.</p>
    </div>
  </footer>
);

export default function App() {
  return <MainContent />;
}
