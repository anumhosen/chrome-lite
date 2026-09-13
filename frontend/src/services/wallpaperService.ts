export interface WallpaperInfo {
  url: string;
  title?: string;
  copyright?: string;
  source: 'bing' | 'unsplash' | 'curated';
}

const STORAGE_KEY = 'chrome_lite_wallpaper';
const ENABLED_KEY = 'chrome_lite_wallpaper_enabled';

// High-quality scenic curated backups to guarantee instant 0ms load and offline reliability
const CURATED_WALLPAPERS: WallpaperInfo[] = [
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    title: 'Yosemite Valley Water Reflection',
    copyright: 'Bailey Zindel / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1920&q=80',
    title: 'Misty Pine Forest & Mountains',
    copyright: 'Kalen Emsley / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
    title: 'Foggy Sunrise Mountain Ridge',
    copyright: 'Qingbao Meng / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    title: 'Deep Sunlight Forest Trail',
    copyright: 'Luca Bravo / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=80',
    title: 'Warm Sunlight in Golden Woods',
    copyright: 'Federico Respini / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    title: 'Tropical Turquoise Ocean Beach',
    copyright: 'Sean Oulashin / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80',
    title: 'Rolling Green Meadows and Hills',
    copyright: 'Robert Bye / Unsplash',
    source: 'curated',
  },
  {
    url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1920&q=80',
    title: 'Calm Alpine Lake at Dawn',
    copyright: 'Andreas Gücklhorn / Unsplash',
    source: 'curated',
  },
];

class WallpaperService {
  private current: WallpaperInfo;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = localStorage.getItem(ENABLED_KEY) !== 'false';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url && !parsed.url.includes('biturl.top')) {
          this.current = parsed;
        } else {
          this.current = CURATED_WALLPAPERS[0];
          this.setWallpaper(this.current);
        }
      } catch {
        this.current = CURATED_WALLPAPERS[0];
      }
    } else {
      this.current = CURATED_WALLPAPERS[0];
    }
  }

  public getWallpaper(): WallpaperInfo {
    return this.current;
  }

  public isWallpaperEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleWallpaperEnabled(enabled?: boolean): boolean {
    this.isEnabled = enabled !== undefined ? enabled : !this.isEnabled;
    localStorage.setItem(ENABLED_KEY, String(this.isEnabled));
    return this.isEnabled;
  }

  public async fetchDailyWallpaper(): Promise<WallpaperInfo> {
    try {
      // Official Microsoft Bing Daily Wallpaper JSON API (CORS enabled)
      const res = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US', {
        cache: 'no-cache',
      });
      if (res.ok) {
        const data = await res.json();
        const img = data?.images?.[0];
        if (img && img.url) {
          const fullUrl = img.url.startsWith('http') ? img.url : `https://www.bing.com${img.url}`;
          const wallpaper: WallpaperInfo = {
            url: fullUrl,
            title: img.title || img.copyright || 'Bing Daily Wallpaper',
            copyright: img.copyright || 'Microsoft Bing',
            source: 'bing',
          };
          this.setWallpaper(wallpaper);
          return wallpaper;
        }
      }
    } catch {
      // Fallback silently if offline or blocked
    }
    return this.current;
  }

  public shuffleWallpaper(): WallpaperInfo {
    // Pick a random wallpaper from the curated high-res list different from current
    const choices = CURATED_WALLPAPERS.filter((w) => w.url !== this.current.url);
    const chosen = choices[Math.floor(Math.random() * choices.length)] || CURATED_WALLPAPERS[0];
    this.setWallpaper(chosen);
    return chosen;
  }

  private setWallpaper(wallpaper: WallpaperInfo): void {
    this.current = wallpaper;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallpaper));
    } catch { }
  }
}

export const wallpaperService = new WallpaperService();
