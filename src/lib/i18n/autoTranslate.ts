// Google Cloud Translation API ile otomatik çeviri
// Cache kullanarak API çağrılarını minimize eder

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CACHE_KEY = 'order_translations_cache';

// Çeviri cache'i
let translationCache: Record<string, Record<string, string>> = {};

// localStorage'dan cache'i yükle
export function loadTranslationCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      translationCache = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Translation cache load failed:', e);
  }
}

// Cache'i kaydet
function saveCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(translationCache));
  } catch (e) {
    console.warn('Translation cache save failed:', e);
  }
}

// Tek metin çevir
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'tr'
): Promise<string> {
  // Aynı dil ise çevirme
  if (targetLang === sourceLang) return text;
  
  // Boş metin
  if (!text || text.trim() === '') return text;
  
  // Cache kontrol
  const cacheKey = `${sourceLang}_${targetLang}`;
  if (!translationCache[cacheKey]) {
    translationCache[cacheKey] = {};
  }
  
  if (translationCache[cacheKey][text]) {
    return translationCache[cacheKey][text];
  }
  
  // API çağrısı
  if (!GOOGLE_API_KEY) {
    console.warn('Google API key not found');
    return text;
  }
  
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    const translated = data.data.translations[0].translatedText;
    
    // Cache'e kaydet
    translationCache[cacheKey][text] = translated;
    saveCache();
    
    return translated;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

// Birden fazla metni toplu çevir (daha verimli)
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'tr'
): Promise<string[]> {
  if (targetLang === sourceLang) return texts;
  if (!GOOGLE_API_KEY) return texts;
  
  const cacheKey = `${sourceLang}_${targetLang}`;
  if (!translationCache[cacheKey]) {
    translationCache[cacheKey] = {};
  }
  
  // Cache'de olmayanları bul
  const uncached: { index: number; text: string }[] = [];
  const results: string[] = [];
  
  texts.forEach((text, index) => {
    if (!text || text.trim() === '') {
      results[index] = text;
    } else if (translationCache[cacheKey][text]) {
      results[index] = translationCache[cacheKey][text];
    } else {
      uncached.push({ index, text });
      results[index] = text; // Placeholder
    }
  });
  
  // Çevrilmemiş varsa API çağır
  if (uncached.length > 0) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: uncached.map(u => u.text),
            source: sourceLang,
            target: targetLang,
            format: 'text'
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        data.data.translations.forEach((t: { translatedText: string }, i: number) => {
          const { index, text } = uncached[i];
          results[index] = t.translatedText;
          translationCache[cacheKey][text] = t.translatedText;
        });
        saveCache();
      }
    } catch (error) {
      console.error('Batch translation failed:', error);
    }
  }
  
  return results;
}

// Cache'i temizle
export function clearTranslationCache(): void {
  translationCache = {};
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}
