'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { translateBatch, loadTranslationCache } from '@/lib/i18n/autoTranslate';

// Türkçe karakter kontrolü
function containsTurkish(text: string): boolean {
  return /[çğıöşüÇĞİÖŞÜ]/.test(text) || 
         /\b(ve|ile|için|bir|bu|da|de|mi|mı|mu|mü|ya|veya|ama|ancak|fakat|çünkü|eğer|ki|gibi|kadar|sonra|önce|şimdi|bugün|dün|yarın)\b/i.test(text);
}

// Text node'ları bul
function getTextNodes(element: Element): Text[] {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim() || '';
        // Boş veya çok kısa metinleri atla
        if (text.length < 2) return NodeFilter.FILTER_REJECT;
        // Script/style içindeki metinleri atla
        const parent = node.parentElement;
        if (parent?.tagName === 'SCRIPT' || parent?.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        // Sadece Türkçe metinleri al
        if (containsTurkish(text)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    nodes.push(node);
  }
  return nodes;
}

export function AutoTranslateWrapper({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const translatedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadTranslationCache();
  }, []);

  useEffect(() => {
    // Türkçe ise çevirme
    if (locale === 'tr' || !containerRef.current) return;

    const translatePage = async () => {
      const textNodes = getTextNodes(containerRef.current!);
      
      if (textNodes.length === 0) return;

      // Benzersiz metinleri topla
      const uniqueTexts: string[] = [];
      const nodeMap: Map<string, Text[]> = new Map();

      textNodes.forEach(node => {
        const text = node.textContent?.trim() || '';
        if (!text || translatedRef.current.has(text)) return;
        
        if (!nodeMap.has(text)) {
          nodeMap.set(text, []);
          uniqueTexts.push(text);
        }
        nodeMap.get(text)!.push(node);
      });

      if (uniqueTexts.length === 0) return;

      // Toplu çeviri
      const translations = await translateBatch(uniqueTexts, locale, 'tr');

      // DOM'u güncelle
      uniqueTexts.forEach((originalText, index) => {
        const translatedText = translations[index];
        if (translatedText && translatedText !== originalText) {
          const nodes = nodeMap.get(originalText) || [];
          nodes.forEach(node => {
            if (node.textContent) {
              node.textContent = node.textContent.replace(originalText, translatedText);
            }
          });
          translatedRef.current.add(originalText);
        }
      });
    };

    // Biraz bekle (render tamamlansın)
    const timeout = setTimeout(translatePage, 500);

    // MutationObserver ile dinamik içerikleri yakala
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      setTimeout(translatePage, 300);
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [locale]);

  // Dil değiştiğinde çeviri cache'ini temizle
  useEffect(() => {
    translatedRef.current.clear();
  }, [locale]);

  return <div ref={containerRef}>{children}</div>;
}
