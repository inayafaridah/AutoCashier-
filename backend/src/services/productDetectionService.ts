import { supabaseAdmin } from '../config/supabaseClient';

interface ProductMatch {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  ai_label: string | null;
  image_url: string | null;
  matchScore: number;
  matchMethod: 'exact_label' | 'fuzzy_label' | 'none';
}

/**
 * Match YOLO detection ONLY to products in database
 * Returns null if no product matches
 */
export async function matchDetectionToProduct(
  detectedLabel: string,
  confidence: number,
  allDetections: { class: string; confidence: number }[] = []
): Promise<ProductMatch | null> {
  try {
    const label = detectedLabel.toLowerCase().trim();

    // Get all products from database
    const { data: allProducts, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, price, stock, category, ai_label, image_url');

    if (error || !allProducts || allProducts.length === 0) {
      console.warn('[productDetection] No products in database');
      return null;
    }

    // 1. Try exact ai_label match
    const exactMatch = allProducts.find(
      p => p.ai_label && p.ai_label.toLowerCase() === label
    );
    if (exactMatch) {
      return {
        ...exactMatch,
        matchScore: confidence,
        matchMethod: 'exact_label',
      };
    }

    // 2. Try fuzzy match on ai_label (word contains)
    if (confidence >= 0.65) {
      const fuzzyMatches = allProducts
        .map(p => {
          const haystack = `${p.name ?? ''} ${p.ai_label ?? ''}`.toLowerCase();
          const score = label
            .split(/\s+/)
            .filter(word => word.length > 2 && haystack.includes(word))
            .length;
          return { product: p, score };
        })
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score);

      if (fuzzyMatches.length > 0) {
        return {
          ...fuzzyMatches[0].product,
          matchScore: confidence,
          matchMethod: 'fuzzy_label',
        };
      }
    }

    // 3. Try alternative detections from YOLO
    if (allDetections && allDetections.length > 0) {
      for (const altDet of allDetections.slice(0, 5)) {
        if (altDet.confidence < 0.5) continue;

        const altLabel = altDet.class.toLowerCase().trim();
        const altMatch = allProducts.find(
          p => p.ai_label && p.ai_label.toLowerCase() === altLabel
        );

        if (altMatch) {
          return {
            ...altMatch,
            matchScore: altDet.confidence,
            matchMethod: 'exact_label',
          };
        }
      }
    }

    // No match found in database
    return null;
  } catch (err) {
    console.error('[productDetection] Error matching detection:', err);
    return null;
  }
}

/**
 * Get all products so frontend can attempt similarity matching
 */
export async function getAllProductsForScanning() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, ai_label, category, image_url');

    if (error) {
      console.error('[productDetection] Error fetching products:', error);
      return [];
    }

    return products || [];
  } catch (err) {
    console.error('[productDetection] Error:', err);
    return [];
  }
}
