# 🔧 ORDER Business Düzeltme Paketi

## 📦 Paket İçeriği

Bu paket, ORDER Business uygulamasının **kritik sorunlarını** düzeltir ve **Customer App ile %100 uyumluluğu** sağlar.

### Oluşturulan/Düzeltilen Dosyalar (13 dosya)

```
order-business-fix/
├── .env.example                    # Environment variables şablonu
├── lib/
│   └── supabase.ts                 # Supabase client (Customer ile uyumlu)
├── types/
│   ├── database.ts                 # Supabase schema types
│   └── index.ts                    # Type exports
├── translations/
│   └── tr.ts                       # Türkçe çeviriler (500+ label)
├── hooks/
│   ├── useSupabase.ts              # Supabase CRUD hooks
│   └── index.ts                    # Hook exports
├── stores/
│   └── index.ts                    # Zustand stores (demo data YOK)
├── components/
│   └── Sidebar.tsx                 # i18n destekli sidebar
└── app/
    ├── menu/page.tsx               # Menü sayfası (Supabase)
    ├── tables/page.tsx             # Masalar sayfası (Supabase)
    ├── kitchen/page.tsx            # Mutfak ekranı (Real-time)
    └── pos/page.tsx                # Kasa/POS (Supabase)
```

---

## ⚡ Hızlı Kurulum

### Adım 1: Dosyaları Kopyala

```bash
# ZIP'i aç
unzip ORDER_Business_Fix_Package.zip -d order-business-fix-temp

# Dosyaları projeye kopyala
cp -r order-business-fix-temp/* ~/Desktop/TiT\ App/order-business/

# Temizle
rm -rf order-business-fix-temp
```

### Adım 2: Environment Variables

```bash
# order-business klasörüne git
cd ~/Desktop/TiT\ App/order-business

# .env.local oluştur
cp .env.example .env.local

# Düzenle - Supabase bilgilerini gir
nano .env.local
```

**.env.local içeriği:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### Adım 3: Test Et

```bash
npm run dev
```

---

## 🔄 Düzeltilen Sorunlar

| # | Sorun | Çözüm |
|---|-------|-------|
| 1 | ❌ Supabase bağlantısı yok | ✅ `lib/supabase.ts` eklendi |
| 2 | ❌ 0 Masa, 0 Kategori | ✅ Hooks ile Supabase'den çekiliyor |
| 3 | ❌ Demo/hardcoded data | ✅ Tüm demo data kaldırıldı |
| 4 | ❌ i18n çalışmıyor | ✅ `translations/tr.ts` (500+ çeviri) |
| 5 | ❌ settings.venueName görünüyor | ✅ `t('settings.venueName')` = "Mekan Adı" |
| 6 | ❌ Schema uyumsuzluğu | ✅ Customer ile aynı types |
| 7 | ❌ Real-time yok | ✅ Supabase subscriptions eklendi |
| 8 | ❌ UTF-8 encoding bozuk | ✅ Türkçe karakterler düzeltildi |

---

## 🔗 Customer App Uyumluluğu

### Aynı Tablo İsimleri
- `venues` ✓
- `tables` ✓
- `categories` ✓
- `products` ✓
- `orders` ✓

### Aynı Kolon Yapıları
```typescript
// Table
interface Table {
  id: string;
  venue_id: string;        // ✓ Aynı
  number: string;          // ✓ Aynı
  status: TableStatus;     // ✓ Aynı değerler
  position_x?: number;     // ✓ Aynı (position.x değil!)
  position_y?: number;     // ✓ Aynı
}

// Order
interface Order {
  items: OrderItemJSON[];  // ✓ JSON array (object array değil!)
  table_number?: string;   // ✓ string (number değil!)
}
```

---

## 📱 Sayfa Özellikleri

### /menu
- ✅ Kategorileri Supabase'den çeker
- ✅ Ürünleri Supabase'den çeker
- ✅ CRUD operasyonları
- ✅ Türkçe arayüz

### /tables
- ✅ Masaları Supabase'den çeker
- ✅ Real-time durum güncellemesi
- ✅ Bölümlere göre filtreleme
- ✅ Durum değiştirme (available/occupied/reserved/cleaning)

### /kitchen
- ✅ Siparişleri real-time çeker
- ✅ Kanban board (Bekleyen/Hazırlanıyor/Hazır)
- ✅ Tek tıkla item durumu değiştirme
- ✅ Sipariş süresi takibi

### /pos
- ✅ Açık hesapları Supabase'den çeker
- ✅ Ödeme alma (7 yöntem)
- ✅ İndirim uygulama
- ✅ Hesap bölme
- ✅ TiT Pay QR entegrasyonu

---

## 🎯 Sonraki Adımlar

1. **Vercel'e deploy et** (environment variables ekle)
2. **Diğer sayfaları düzelt**: `/orders`, `/settings`, `/reservations`
3. **TiT Brain'i güncelle**: Bu kontrolleri ekle

---

## 📞 Test Checklist

Kurulumdan sonra kontrol et:

- [ ] Menu sayfası kategorileri gösteriyor mu?
- [ ] Tables sayfası masaları gösteriyor mu?
- [ ] Kitchen sayfası siparişleri gösteriyor mu?
- [ ] POS sayfası açık hesapları gösteriyor mu?
- [ ] Tüm label'lar Türkçe mi?
- [ ] Real-time güncellemeler çalışıyor mu?

---

**Hazırlayan:** Claude  
**Tarih:** 2 Ocak 2026  
**Versiyon:** 1.0.0
