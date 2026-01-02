'use client';

import { useState, useRef, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { 
  FileSpreadsheet, 
  Camera, 
  ArrowLeft, 
  Loader2, 
  Check, 
  Download,
  Upload,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  Wand2,
  ImageIcon,
  Video,
  SwitchCamera
} from 'lucide-react';
import Link from 'next/link';

interface MenuItemImport {
  name: string;
  price: number;
  category: string;
  description?: string;
}

export default function MenuImportPage() {
  const { currentVenue, venues } = useVenueStore();
  const [importMethod, setImportMethod] = useState<'file' | 'photo' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<MenuItemImport[] | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'success'>('idle');
  const [selectedVenue, setSelectedVenue] = useState(currentVenue?.id || '');
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Kamera başlat
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      setShowPhotoOptions(false);
      
      // Video elementine bağla
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Kamera erişimi hatası:', err);
      setErrorMessage('Kamera erişimi sağlanamadı. Lütfen izin verin veya galeriden seçin.');
    }
  };

  // Kamera durdur
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Fotoğraf çek
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoPreview(dataUrl);
    stopCamera();
    setImportMethod('photo');
  };

  // Component unmount olunca kamerayı kapat
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // CSV parse
  const parseCSV = (text: string): MenuItemImport[] => {
    const lines = text.trim().split('\n');
    const items: MenuItemImport[] = [];
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('ürün') || firstLine.includes('name') || firstLine.includes('fiyat');
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      let parts = line.includes('\t') ? line.split('\t') : line.split(/[,;]/);
      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length >= 2) {
        const name = parts[0];
        const priceStr = parts[1].replace(/[^\d.,]/g, '').replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (name && !isNaN(price)) {
          items.push({ name, price, category: parts[2] || 'Genel', description: parts[3] || '' });
        }
      }
    }
    return items;
  };

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const text = await file.text();
      const items = parseCSV(text);
      if (items.length === 0) {
        setErrorMessage('Dosyada geçerli ürün bulunamadı.');
        setIsLoading(false);
        return;
      }
      setPreviewData(items);
      setImportStatus('preview');
    } catch (err) {
      setErrorMessage('Dosya okunamadı.');
    }
    setIsLoading(false);
  };

  // Galeriden seç
  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
      setShowPhotoOptions(false);
      setImportMethod('photo');
    };
    reader.readAsDataURL(file);
  };

  // AI ile menü oku
  const processWithAI = async () => {
    if (!photoPreview) return;
    
    setAiProcessing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai/read-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoPreview })
      });

      if (!response.ok) throw new Error('AI işlemi başarısız');

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setPreviewData(data.items);
        setImportStatus('preview');
      } else {
        setErrorMessage(data.message || 'Menüde ürün bulunamadı. Daha net fotoğraf deneyin.');
      }
    } catch (err) {
      console.error('AI Error:', err);
      setErrorMessage('AI menüyü okuyamadı. Manuel giriş veya CSV kullanın.');
    }
    
    setAiProcessing(false);
  };

  // Import işlemi
  const handleImport = async () => {
    if (!previewData || !selectedVenue) return;
    
    setImportStatus('importing');
    setIsLoading(true);
    let count = 0;
    
    for (const item of previewData) {
      try {
        const { error } = await supabase.from('products').insert({
          venue_id: selectedVenue,
          name: item.name,
          description: item.description || null,
          price: item.price,
          category: item.category,
          is_available: true,
        });
        if (!error) count++;
      } catch (err) {
        console.error(err);
      }
    }
    
    setImportedCount(count);
    setImportStatus('success');
    setIsLoading(false);
  };

  const updateItem = (index: number, field: keyof MenuItemImport, value: string | number) => {
    if (!previewData) return;
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value };
    setPreviewData(newData);
  };

  const removeItem = (index: number) => {
    if (!previewData) return;
    setPreviewData(previewData.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    const template = `Ürün Adı,Fiyat,Kategori,Açıklama
Humus,280,Soğuk Mezeler,Nohut ezmesi
Levrek Izgara,850,Deniz Ürünleri,Taze levrek
Künefe,350,Tatlılar,Antep fıstıklı`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'menu_sablonu.csv';
    link.click();
  };

  const groupedPreview = previewData?.reduce((acc, item, index) => {
    const cat = item.category || 'Genel';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...item, _index: index });
    return acc;
  }, {} as Record<string, (MenuItemImport & { _index: number })[]>);

  const resetAll = () => {
    setImportStatus('idle');
    setPreviewData(null);
    setImportMethod(null);
    setPhotoPreview(null);
    setErrorMessage('');
    setShowPhotoOptions(false);
    stopCamera();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/menu" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menü İçe Aktar</h1>
          <p className="text-gray-500">Excel, CSV veya fotoğraftan menü yükleyin</p>
        </div>
      </div>

      {/* Venue Seçimi */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Menü hangi mekana eklensin?</label>
        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900"
        >
          <option value="">Mekan Seçin</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {/* Hidden Inputs */}
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGallerySelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />

      {/* Kamera Görünümü */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50">
          {/* Üst bar - Kapat butonu */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
            <button type="button"
              onClick={stopCamera}
              className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <span className="text-white font-medium">Menüyü Çerçeveye Hizalayın</span>
            <div className="w-12 h-12"></div>
          </div>

          {/* Video */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Overlay guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/60 rounded-xl w-[85%] h-[60%] shadow-lg"></div>
          </div>

          {/* Alt bar - Çekim butonu */}
          <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center bg-gradient-to-t from-black/70 to-transparent">
            <button type="button"
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/50 shadow-xl active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-200"></div>
            </button>
          </div>
        </div>
      )}

      {/* Import Metodları */}
      {importStatus === 'idle' && !photoPreview && !showCamera && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <button type="button"
              onClick={() => setImportMethod('file')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                importMethod === 'file' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <FileSpreadsheet className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Excel / CSV Dosyası</h3>
              <p className="text-sm text-gray-500">Menünüzü Excel veya CSV formatında yükleyin</p>
              <p className="text-xs text-green-600 mt-2">✓ En hızlı yöntem</p>
            </button>

            <button type="button"
              onClick={() => setShowPhotoOptions(true)}
              className="p-6 rounded-xl border-2 text-left transition-all border-gray-200 hover:border-purple-300"
            >
              <Camera className="w-12 h-12 text-purple-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Fotoğraftan AI ile Oku</h3>
              <p className="text-sm text-gray-500">Menü fotoğrafını AI otomatik okusun</p>
              <p className="text-xs text-purple-600 mt-2">✨ Yapay Zeka Destekli</p>
            </button>
          </div>

          {/* Fotoğraf Seçenekleri Modal */}
          {showPhotoOptions && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Fotoğraf Ekle</h3>
                  <button type="button" onClick={() => setShowPhotoOptions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <button type="button"
                    onClick={startCamera}
                    className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Kamera ile Çek</p>
                      <p className="text-sm text-gray-500">Menüyü şimdi fotoğrafla</p>
                    </div>
                  </button>
                  
                  <button type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Galeriden Seç</p>
                      <p className="text-sm text-gray-500">Mevcut fotoğrafı yükle</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Excel/CSV Upload */}
          {importMethod === 'file' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Örnek Şablon</h4>
                  <p className="text-sm text-blue-700 mt-1">Format: Ürün Adı, Fiyat, Kategori, Açıklama</p>
                  <button type="button" onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    <Download className="w-4 h-4" /> Şablonu İndir
                  </button>
                </div>
              </div>

              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Dosya Yükle</h3>
                <p className="text-gray-500">CSV veya TXT dosyanızı seçin</p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  <span className="ml-2">Dosya okunuyor...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Fotoğraf Önizleme */}
      {photoPreview && importStatus === 'idle' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Menü Fotoğrafı</h3>
            <button type="button" onClick={resetAll} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <img src={photoPreview} alt="Menü" className="w-full max-h-96 object-contain rounded-lg border" />

          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Wand2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-900">AI Menü Okuma</h4>
                <p className="text-sm text-purple-700 mt-1">Yapay zeka ürün adlarını ve fiyatları algılayacak.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPhotoOptions(true)} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">
              Başka Fotoğraf
            </button>
            <button type="button"
              onClick={processWithAI}
              disabled={aiProcessing || !selectedVenue}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> AI Okuyor...</> : <><Sparkles className="w-5 h-5" /> Menüyü Oku</>}
            </button>
          </div>
          {!selectedVenue && <p className="text-center text-amber-600 text-sm">⚠️ Önce mekan seçin</p>}
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{errorMessage}</p>
          <button type="button" onClick={() => setErrorMessage('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Preview */}
      {importStatus === 'preview' && previewData && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Menü Önizleme</h3>
              <p className="text-sm text-gray-500">{previewData.length} ürün</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={resetAll} className="px-4 py-2 border rounded-lg hover:bg-gray-100">İptal</button>
              <button type="button" onClick={handleImport} disabled={isLoading || !selectedVenue} className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {previewData.length} Ürünü İçe Aktar
              </button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {groupedPreview && Object.entries(groupedPreview).map(([category, items]) => (
              <div key={category} className="border-b last:border-0">
                <div className="px-4 py-2 bg-gray-100 font-medium text-gray-700">{category} ({items.length})</div>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item._index} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <input value={item.name} onChange={(e) => updateItem(item._index, 'name', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                        <input type="number" value={item.price} onChange={(e) => updateItem(item._index, 'price', parseFloat(e.target.value) || 0)} className="px-2 py-1 border rounded text-sm" />
                        <input value={item.category} onChange={(e) => updateItem(item._index, 'category', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                        <input value={item.description || ''} onChange={(e) => updateItem(item._index, 'description', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                      </div>
                      <button type="button" onClick={() => removeItem(item._index)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success */}
      {importStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Tamamlandı!</h3>
          <p className="text-green-600 mb-6">{importedCount} ürün eklendi</p>
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={resetAll} className="px-6 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100">Başka Ekle</button>
            <Link href="/menu" className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Menüye Git</Link>
          </div>
        </div>
      )}
    </div>
  );
}