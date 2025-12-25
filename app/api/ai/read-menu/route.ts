import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Görsel gerekli' }, { status: 400 });
    }

    // Claude API anahtarı
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      // API key yoksa demo data dön
      return NextResponse.json({
        items: [
          { name: 'Demo Ürün 1', price: 100, category: 'Genel', description: 'API key ayarlanmamış' },
          { name: 'Demo Ürün 2', price: 150, category: 'Genel', description: 'API key ayarlanmamış' },
        ],
        message: 'Demo mod - ANTHROPIC_API_KEY .env dosyasına ekleyin'
      });
    }

    // Base64 formatını ayıkla
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    // Claude Vision API çağrısı
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Bu bir restoran menüsü fotoğrafı. Lütfen menüdeki tüm ürünleri ve fiyatları çıkar.

Her ürün için şu bilgileri JSON formatında döndür:
- name: Ürün adı
- price: Fiyat (sadece sayı, TL/₺ işareti olmadan)
- category: Kategori (Soğuk Mezeler, Sıcak Mezeler, Salatalar, Ana Yemekler, Deniz Ürünleri, Et Yemekleri, Makarnalar, Pizzalar, Tatlılar, Sıcak İçecekler, Soğuk İçecekler, Biralar, Şaraplar, Kokteyller, vb.)
- description: Varsa açıklama (yoksa boş string)

SADECE JSON array döndür, başka açıklama ekleme. Format:
[
  {"name": "Humus", "price": 280, "category": "Soğuk Mezeler", "description": "Nohut ezmesi"},
  ...
]`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API Error:', error);
      return NextResponse.json({ error: 'AI işlemi başarısız' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // JSON'u parse et
    try {
      // JSON array'i bul
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ items });
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
    }

    return NextResponse.json({ error: 'Menü okunamadı', raw: content }, { status: 500 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
