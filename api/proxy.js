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
    // Извлекаем endpoint из пути URL
    const pathParts = req.url.split('/');
    const endpoint = pathParts[pathParts.length - 1].split('?')[0]; // Получаем последнюю часть пути

    // Если endpoint - это 'orders', но нужно обращаться к 'sales'
    const actualEndpoint = endpoint === 'orders' ? 'sales' : endpoint;

    // Строим URL для вашего API
    const apiUrl = new URL(`http://109.73.206.144:6969/api/${actualEndpoint}`);

    // Добавляем все query-параметры
    Object.entries(req.query).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });

    console.log('Proxying request to:', apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
