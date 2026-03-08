const root = document.getElementById('root');

root.innerHTML = `
  <section class="card">
    <h1>CityHawk Frontend Server</h1>
    <p>Сервер поднят и проксирует API на backend.</p>
    <p>Проверь:</p>
    <div class="code">GET /health</div>
    <div class="code">POST /auth/login</div>
    <div class="code">POST /auth/refresh</div>
    <div class="code">GET /me</div>
  </section>
`;
