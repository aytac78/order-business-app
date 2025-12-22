# ORDER Business - Proje Durumu

## Teknoloji
- Next.js 15, TypeScript, Tailwind CSS
- Zustand (state management)
- Port: 3001

## Tamamlanan Sayfalar (22)
- Dashboard (multi-venue)
- POS/Kasa (TiT Pay, manuel ödeme)
- Mutfak (Kanban: Bekleyen/Hazırlanıyor/Hazır)
- Masalar (drag-drop düzenleme)
- Rezervasyonlar (varış saati takibi)
- Menü Yönetimi
- Siparişler
- Stok Yönetimi
- Stok Uyarıları
- Raporlar
- Analitik
- Personel
- Performans
- Vardiyalar
- Müşteri CRM
- Kuponlar
- QR Menü
- Ayarlar
- Garson Paneli
- Resepsiyon
- Onboarding
- Mekan Yönetimi

## Klasör Yapısı
src/
├── app/(dashboard)/ → Tüm sayfalar
├── components/ → Layout, Venue, Dashboard
├── stores/ → Zustand stores
├── lib/ → Supabase, utils
└── types/ → TypeScript types

## Çalıştırma
npm install && npm run dev
