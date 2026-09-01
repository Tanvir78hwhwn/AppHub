import { GoogleGenAI } from '@google/genai';

export interface GeneratedMetadata {
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

/**
 * Clean and normalize rule-based metadata fallback if Gemini API is not configured or fails
 */
function createFallbackMetadata(rawTitle: string, rawDescription: string, type: string): GeneratedMetadata {
  const cleanTitle = rawTitle ? rawTitle.replace(/[-_]/g, ' ').replace(/\.apk$/i, '').trim() : `Imported ${type.toUpperCase()}`;
  const capitalizedTitle = cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const shortDesc = rawDescription 
    ? rawDescription.slice(0, 160).trim() 
    : `Verified ${type} ready for high-speed download and installation. Includes full documentation and support.`;

  const fullDesc = rawDescription && rawDescription.length > 50
    ? rawDescription
    : `${capitalizedTitle} is a verified ${type} resource with performance optimizations, security validation, and complete feature access. Compatible with modern devices.`;

  let category = 'Developer Tools';
  if (type === 'course' || type === 'video') category = 'Android Mastery';
  if (/security|vpn|guard|clean/i.test(capitalizedTitle)) category = 'Security & Utilities';
  if (/media|video|audio|music/i.test(capitalizedTitle)) category = 'Media & Audio';
  if (/track|note|task|office|flow/i.test(capitalizedTitle)) category = 'Productivity & Office';

  const baseTags = [type.toUpperCase(), category.split(' ')[0], 'Verified', 'Download'];
  const extractedWords = capitalizedTitle.split(' ').filter(w => w.length > 3).slice(0, 3);
  const tags = Array.from(new Set([...extractedWords, ...baseTags]));

  return {
    title: capitalizedTitle,
    description: shortDesc,
    fullDescription: fullDesc,
    category,
    tags,
    seoTitle: `${capitalizedTitle} - Download & Tutorials | AppHub`,
    seoDescription: shortDesc
  };
}

/**
 * Enhances imported resource metadata using Gemini AI
 */
export async function enhanceMetadataWithAi(params: {
  rawTitle: string;
  rawDescription?: string;
  contentType: 'apk' | 'video' | 'course' | 'file';
  sourceUrl?: string;
}): Promise<GeneratedMetadata> {
  const { rawTitle, rawDescription = '', contentType, sourceUrl = '' } = params;
  const fallback = createFallbackMetadata(rawTitle, rawDescription, contentType);

  const ai = getAiClient();
  if (!ai) {
    return fallback;
  }

  try {
    const prompt = `You are an expert digital content curator and SEO optimizer for a high-quality digital app and video course marketplace.
Analyze the following imported item information and generate professional, engaging, and accurate metadata.

ITEM TYPE: ${contentType}
ORIGINAL TITLE: ${rawTitle}
ORIGINAL DESCRIPTION: ${rawDescription}
SOURCE URL: ${sourceUrl}

Available Categories:
- "Developer Tools"
- "Android Mastery"
- "Productivity & Office"
- "Web & Full-Stack"
- "Media & Audio"
- "Security & Utilities"

Return ONLY a valid JSON object matching this structure:
{
  "title": "Clean, polished, and descriptive title (e.g. 'Termux Linux Terminal Emulator')",
  "description": "Engaging single-paragraph summary (under 160 chars)",
  "fullDescription": "Comprehensive markdown-formatted overview of features, use cases, and requirements",
  "category": "One of the exact available categories above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "SEO title for search engines (max 65 chars)",
  "seoDescription": "Meta description for search engines (max 155 chars)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (!text) return fallback;

    const parsed = JSON.parse(text);
    return {
      title: parsed.title || fallback.title,
      description: parsed.description || fallback.description,
      fullDescription: parsed.fullDescription || fallback.fullDescription,
      category: parsed.category || fallback.category,
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : fallback.tags,
      seoTitle: parsed.seoTitle || fallback.seoTitle,
      seoDescription: parsed.seoDescription || fallback.seoDescription
    };
  } catch (error) {
    console.warn('Gemini metadata generation failed, using rule-based fallback:', error);
    return fallback;
  }
}
