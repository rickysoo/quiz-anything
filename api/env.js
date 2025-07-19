export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return environment variables to the client
    res.status(200).json({
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || null
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}