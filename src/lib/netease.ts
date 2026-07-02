import { Track } from "../types";

const API_BASE = "/api/v1/music";
const NETEASE_BASE = "http://127.0.0.1:3001";

export function getNeteaseCookie() {
  return localStorage.getItem("netease_cookie") || "";
}

// --- QR Login APIs ---
export async function getLoginQrKey() {
  const res = await fetch(`${NETEASE_BASE}/login/qr/key?timestamp=${Date.now()}`);
  const data = await res.json();
  return data.data.unikey;
}

export async function createLoginQrImage(key: string) {
  const res = await fetch(`${NETEASE_BASE}/login/qr/create?key=${key}&qrimg=true&timestamp=${Date.now()}`);
  const data = await res.json();
  return data.data.qrimg;
}

export async function checkLoginQrStatus(key: string) {
  const res = await fetch(`${NETEASE_BASE}/login/qr/check?key=${key}&timestamp=${Date.now()}`);
  return await res.json();
}

// --- Music APIs ---
export async function searchMusic(keyword: string) {
  if (getNeteaseCookie()) {
    try {
      const res = await fetch(`${NETEASE_BASE}/search?keywords=${encodeURIComponent(keyword)}&limit=15`);
      const data = await res.json();
      const songs = data.result?.songs || [];
      return songs.map((s: any) => ({
        id: s.id.toString(),
        title: s.name,
        artist: s.ar?.[0]?.name || s.artists?.[0]?.name || "未知歌手",
        album: s.al?.name || s.album?.name || "未知专辑",
        coverUrl: s.al?.picUrl || s.album?.artist?.img1v1Url || "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=400&auto=format&fit=crop",
        isNetease: true
      }));
    } catch (e) {
      console.error("Netease search failed", e);
    }
  }

  // Fallback to Python backend
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(keyword)}`);
  const data = await res.json();
  return data || [];
}

export async function getSongUrl(id: string, isNetease?: boolean): Promise<string | null> {
  if (isNetease) {
    const cookie = getNeteaseCookie();
    // use level=exhigh for VIP lossless
    const res = await fetch(`${NETEASE_BASE}/song/url/v1?id=${id}&level=exhigh&timestamp=${Date.now()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cookie=${encodeURIComponent(cookie)}`
    });
    const data = await res.json();
    return data.data?.[0]?.url || null;
  }
  const res = await fetch(`${API_BASE}/stream?id=${id}`);
  const data = await res.json();
  return data.url || null;
}

export async function getSongLyric(id: string, title?: string, artist?: string, isNetease?: boolean): Promise<string[]> {
  if (isNetease) {
    const res = await fetch(`${NETEASE_BASE}/lyric?id=${id}`);
    const data = await res.json();
    const lrc = data.lrc?.lyric || "";
    return lrc.split("\n");
  }

  const url = new URL(`${API_BASE}/lyrics`, window.location.origin);
  url.searchParams.append("id", id);
  if (title) url.searchParams.append("title", title);
  if (artist) url.searchParams.append("artist", artist);
  
  const res = await fetch(url.toString());
  const data = await res.json();
  return data.lyrics || [];
}

export async function mapSongToTrack(song: any): Promise<Track> {
  const url = await getSongUrl(song.id, song.isNetease);
  const lyrics = await getSongLyric(song.id, song.title, song.artist, song.isNetease);
  
  // Try to parse basic LRC formatting if available, otherwise just use lines
  let parsedLyrics: {time: number; text: string}[] = [];
  
  let validLyrics = lyrics;
  if (!Array.isArray(lyrics)) {
    validLyrics = ["纯音乐，请欣赏"];
  }

  for (let i = 0; i < validLyrics.length; i++) {
    const line = validLyrics[i];
    const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        parsedLyrics.push({ time: minutes * 60 + seconds, text: text });
      }
    } else if (line.trim()) {
      // Fake time if no timestamps
      parsedLyrics.push({ time: i * 3, text: line.trim() });
    }
  }

  if (parsedLyrics.length === 0) {
    parsedLyrics = [{ time: 0, text: "暂无歌词 / No lyrics available" }];
  }
  
  return {
    id: song.isNetease ? `nt-${song.id}` : `yt-${song.id}`,
    title: song.title,
    artist: song.artist || '未知歌手',
    album: song.album || '未知专辑',
    coverUrl: song.coverUrl || "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=400&auto=format&fit=crop",
    lyrics: parsedLyrics as any,
    audioUrl: url
  } as Track;
}
