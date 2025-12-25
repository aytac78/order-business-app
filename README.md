# ORDER Business - Birleştirilmiş Sürüm

Restoran yönetim sistemi - Auth sistemi + Tüm yönetim modülleri + Tablet panelleri

## 🔐 Auth Sistemi

### Demo Hesapları
| Rol | Email | Şifre | PIN | Varsayılan Route |
|-----|-------|-------|-----|-----------------|
| Admin | admin@order.app | admin123 | 1234 | / (tüm erişim) |
| Chef | chef@order.app | chef123 | 1111 | /kitchen |
| Waiter | waiter@order.app | waiter123 | 2222 | /waiter |
| Cashier | cashier@order.app | cashier123 | 3333 | /pos |
| Host | host@order.app | host123 | 4444 | /reception |

## 📱 Tablet Panelleri (Personel İçin)
- `/kitchen` - Mutfak Paneli (Chef)
- `/waiter` - Garson Paneli (Waiter)
- `/pos` - Kasa Paneli (Cashier)
- `/reception` - Resepsiyon Paneli (Host)

## 🖥️ Yönetim Modülleri (Admin/Manager İçin)
- `/dashboard` - Ana Dashboard
- `/menu` - Menü Yönetimi
- `/orders` - Sipariş Takibi
- `/tables` - Masa Yönetimi
- `/reservations` - Rezervasyonlar
- `/staff` - Personel Yönetimi
- `/stock` - Stok Yönetimi
- `/analytics` - Analitik
- `/reports` - Raporlar
- `/crm` - Müşteri CRM
- `/settings` - Ayarlar
- ... ve 10+ daha fazla modül

## 🌐 Çoklu Dil Desteği
- Türkçe (TR)
- English (EN)
- Italiano (IT)
- العربية (AR)
- فارسی (FA)
- Bahasa Indonesia (ID)

## 🚀 Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda aç: http://localhost:3001/login

## 📁 Proje Yapısı

```
order-business/
├── app/
│   ├── login/           # Giriş sayfası
│   ├── page.tsx         # Ana sayfa (Dashboard redirect)
│   ├── kitchen/         # Mutfak Tablet Paneli
│   ├── waiter/          # Garson Tablet Paneli
│   ├── pos/             # Kasa Tablet Paneli
│   ├── reception/       # Resepsiyon Tablet Paneli
│   ├── (dashboard)/     # Yönetim Modülleri (22 sayfa)
│   └── api/             # API Routes
├── components/
│   ├── auth/            # Auth bileşenleri
│   ├── layout/          # Layout bileşenleri
│   ├── dashboard/       # Dashboard bileşenleri
│   └── venue/           # Mekan bileşenleri
├── lib/
│   ├── auth/            # Auth sistemi
│   ├── i18n/            # Çoklu dil
│   └── services/        # Supabase servisleri
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

## 🔧 Teknolojiler
- Next.js 14 + TypeScript
- Tailwind CSS
- Zustand (State Management)
- Supabase (Backend)
- Lucide React (Icons)

## 📝 Notlar
- Port: 3001
- Mock auth - Production'da Supabase auth'a çevrilecek
- Tablet panelleri touch-optimized
- Tüm rotalar korumalı (ProtectedRoute)
