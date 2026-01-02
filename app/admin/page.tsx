'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, CreditCard, Calendar, BarChart3,
  Users, DollarSign, ShoppingCart,
  ArrowUpRight, LogOut,
  UtensilsCrossed, Star, Package, Settings
} from 'lucide-react';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const quickActions = [
  { title: 'Mutfak', description: 'Siparişleri yönet', href: '/kitchen', icon: ChefHat, bgColor: 'from-orange-500 to-red-600' },
  { title: 'Garson', description: 'Masa ve siparişler', href: '/waiter', icon: UtensilsCrossed, bgColor: 'from-blue-500 to-cyan-600' },
  { title: 'Kasa', description: 'Ödeme ve hesap', href: '/pos', icon: CreditCard, bgColor: 'from-emerald-500 to-teal-600' },
  { title: 'Resepsiyon', description: 'Rezervasyonlar', href: '/reception', icon: Calendar, bgColor: 'from-purple-500 to-pink-600' },
  { title: 'Stok', description: 'Malzeme ve reçete', href: '/stock', icon: Package, bgColor: 'from-amber-500 to-orange-600' },
  { title: 'Personel', description: 'Çalışan yönetimi', href: '/staff', icon: Users, bgColor: 'from-indigo-500 to-purple-600' },
  { title: 'Raporlar', description: 'Analiz ve veriler', href: '/reports', icon: BarChart3, bgColor: 'from-cyan-500 to-blue-600' },
  { title: 'Ayarlar', description: 'Sistem ayarları', href: '/settings', icon: Settings, bgColor: 'from-zinc-500 to-zinc-600' },
];

export default function AdminPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Demo Restaurant</h1>
              <p className="text-[10px] text-zinc-500">Yönetici Paneli</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button type="button" 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Çıkış</span>
            </button>
            
            <div className="text-right pl-3 border-l border-zinc-700">
              <div className="text-lg font-mono font-bold leading-tight">
                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-zinc-500">
                {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Bugünkü Ciro</p>
                <p className="text-xl font-bold text-white">{formatCurrency(12450)}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>%22</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Siparişler</p>
                <p className="text-xl font-bold text-white">47</p>
                <p className="text-[10px] text-zinc-500 mt-1">8 aktif</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Masa Doluluk</p>
                <p className="text-xl font-bold text-white">%60</p>
                <p className="text-[10px] text-zinc-500 mt-1">12/20 masa</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Rezervasyon</p>
                <p className="text-xl font-bold text-white">15</p>
                <p className="text-[10px] text-zinc-500 mt-1">6 yaklaşan</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold mb-2 text-zinc-400">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">{action.title}</h3>
                      <p className="text-[10px] text-zinc-500">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Rating */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Müşteri Puanı</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">4.7</span>
                  <span className="text-xs text-zinc-500">/ 5.0</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">234</p>
              <p className="text-[10px] text-zinc-500">toplam değerlendirme</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}