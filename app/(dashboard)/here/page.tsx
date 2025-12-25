'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Users,
  Clock,
  MessageSquare,
  Eye,
  EyeOff,
  RefreshCw,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface CheckedInUser {
  id: string;
  user_id: string;
  venue_id: string;
  checked_in_at: string;
  is_visible: boolean;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function HerePage() {
  const { currentVenue } = useVenueStore();
  const [checkedInUsers, setCheckedInUsers] = useState<CheckedInUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch checked-in users
  const fetchCheckedInUsers = async () => {
    if (!currentVenue) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('venue_checkins')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('is_active', true)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;

      // User bilgilerini ayrı çek
      const usersWithProfiles = await Promise.all(
        (data || []).map(async (checkin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', checkin.user_id)
            .single();

          return {
            ...checkin,
            user: profile || { id: checkin.user_id, full_name: 'Misafir', avatar_url: null }
          };
        })
      );

      setCheckedInUsers(usersWithProfiles);
    } catch (err) {
      console.error('Error fetching checked-in users:', err);
      setError('Müşteri verileri yüklenirken hata oluştu');
      setCheckedInUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckedInUsers();

    // Real-time subscription
    if (currentVenue) {
      const channel = supabase
        .channel('venue-checkins')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'venue_checkins',
            filter: `venue_id=eq.${currentVenue.id}`,
          },
          () => {
            fetchCheckedInUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentVenue]);

  // Calculate time since check-in
  const getTimeSinceCheckIn = (checkedInAt: string): string => {
    const now = new Date();
    const checkInTime = new Date(checkedInAt);
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return checkInTime.toLocaleDateString('tr-TR');
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">HERE panelini kullanmak için bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-orange-500" />
            HERE - Mekandaki Müşteriler
          </h1>
          <p className="text-gray-500 mt-1">
            {currentVenue.name} - Şu an mekanda bulunan müşteriler
          </p>
        </div>

        <button
          onClick={fetchCheckedInUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{checkedInUsers.length}</p>
              <p className="text-sm text-gray-500">Toplam Check-in</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {checkedInUsers.filter(u => u.is_visible).length}
              </p>
              <p className="text-sm text-gray-500">Görünür Müşteri</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {checkedInUsers.filter(u => {
                  const diffMs = Date.now() - new Date(u.checked_in_at).getTime();
                  return diffMs < 30 * 60 * 1000; // Son 30 dakika
                }).length}
              </p>
              <p className="text-sm text-gray-500">Son 30 dk</p>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mekandaki Müşteriler</h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        ) : checkedInUsers.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henüz check-in yapan müşteri yok</p>
            <p className="text-sm text-gray-400 mt-1">
              Müşteriler ORDER uygulamasından HERE özelliğini kullandığında burada görünecekler
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {checkedInUsers.map((checkin) => (
              <div
                key={checkin.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                    {checkin.user?.avatar_url ? (
                      <img
                        src={checkin.user.avatar_url}
                        alt={checkin.user?.full_name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      {checkin.user?.full_name || 'Misafir'}
                      {checkin.is_visible ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeSinceCheckIn(checkin.checked_in_at)}
                    </p>
                  </div>
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  onClick={() => {
                    // TODO: Open message modal
                    alert('Mesaj özelliği yakında eklenecek');
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Mesaj</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">HERE Özelliği Hakkında</h3>
            <p className="text-sm text-gray-600">
              HERE, müşterilerin ORDER uygulamasından check-in yaparak mekanda bulunduklarını 
              paylaşmalarını sağlar. Bu sayede müşterilerle daha kişisel bir iletişim kurabilir, 
              özel teklifler sunabilir ve sosyal deneyimlerini zenginleştirebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}