// api/music-search/index.js
export default function handler(req, res) {
  // Set CORS headers so your GitHub Pages can talk to Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Search query required" });

  // SYSTEM ANTHEM AND EXPERIMENTAL DATA
  const library = [
    { 
      id: "vS3_7V99VEE", 
      title: "Aakaasam Nee Haddhu Ra", 
      artist: "G.V. Prakash Kumar", 
      banner: "https://img.youtube.com/vi/vS3_7V99VEE/maxresdefault.jpg" 
    },
    { 
      id: "Y-N0V0X1B4k", 
      title: "Resilience Protocol", 
      artist: "Mahesh Systems", 
      banner: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400" 
    },
    {
      id: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      banner: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    }
  ];

  // Perform fuzzy search
  const filtered = library.filter(song => 
    song.title.toLowerCase().includes(q.toLowerCase()) || 
    song.artist.toLowerCase().includes(q.toLowerCase())
  );

  return res.status(200).json(filtered.length > 0 ? filtered : library);
}