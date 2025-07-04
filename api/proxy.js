// api/proxy.js
export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint, ...params } = req.query;

    // Строим URL для вашего API
    const apiUrl = new URL(`http://109.73.206.144:6969/api/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}
