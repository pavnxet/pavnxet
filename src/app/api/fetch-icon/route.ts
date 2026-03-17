import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000,
    });

    const $ = cheerio.load(response.data);
    let iconUrl = '';

    const selectors = [
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="alternate icon"]',
    ];

    for (const selector of selectors) {
      const href = $(selector).attr('href');
      if (href) {
        iconUrl = href;
        break;
      }
    }

    if (iconUrl && !iconUrl.startsWith('http')) {
      const urlObj = new URL(url);
      if (iconUrl.startsWith('//')) {
        iconUrl = 'https:' + iconUrl;
      } else if (iconUrl.startsWith('/')) {
        iconUrl = urlObj.origin + iconUrl;
      } else {
        iconUrl = urlObj.origin + '/' + iconUrl;
      }
    }

    if (!iconUrl) {
      const urlObj = new URL(url);
      iconUrl = `${urlObj.origin}/favicon.ico`;
    }

    return NextResponse.json({ iconUrl });
  } catch (error) {
    console.error('Error fetching icon:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to fetch icon' }, { status: 500 });
  }
}
