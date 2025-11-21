# Migration Guide: SSE to Streamable HTTP Transport

## Přehled

Tento průvodce vám pomůže migrovat z deprecated SSE transportu na nový Streamable HTTP transport.

## Co se změnilo

### Změny endpointů

**Před (SSE):**
- `GET /sse` - Otevření SSE connection
- `POST /message` - Posílání MCP zpráv

**Po (Streamable HTTP):**
- `POST /mcp/v1/endpoint` - Hlavní MCP endpoint
- `GET /mcp/v1/endpoint` - Alternativní GET endpoint

### Změny v headers

**Před (SSE):**
```http
X-Session-ID: <session-id>
Content-Type: application/json
```

**Po (Streamable HTTP):**
```http
Mcp-Session-Id: <session-id>
MCP-Protocol-Version: 2025-03-26
Content-Type: application/json
Accept: text/event-stream  # pro GET requesty
```

### Změny v session managementu

**Před (SSE):**
- Session ID vygenerováno pomocí `Math.random()`
- Vráceno v `X-Session-ID` header
- Transport: `/sse` pro connection, `/message` pro zprávy

**Po (Streamable HTTP):**
- Session ID vygenerováno pomocí `randomUUID()` (RFC 4122)
- Vráceno v `Mcp-Session-Id` header
- Transport: `/mcp/v1/endpoint` pro vše

## Kroky migrace

### Krok 1: Aktualizace klientské konfigurace

**Před (SSE):**
```javascript
const sseUrl = 'http://localhost:3000/sse';
const messageUrl = 'http://localhost:3000/message';

// Otevření SSE connection
const eventSource = new EventSource(sseUrl);
const sessionId = eventSource.headers['x-session-id'];

// Posílání zpráv
fetch(messageUrl, {
  method: 'POST',
  headers: {
    'X-Session-ID': sessionId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(request)
});
```

**Po (Streamable HTTP):**
```javascript
const mcpUrl = 'http://localhost:3000/mcp/v1/endpoint';
let sessionId = null;

// Inicializace
const response = await fetch(mcpUrl, {
  method: 'POST',
  headers: {
    'MCP-Protocol-Version': '2025-03-26',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'my-client', version: '1.0.0' }
    }
  })
});

// Získání session ID
sessionId = response.headers.get('mcp-session-id');

// Další requesty
await fetch(mcpUrl, {
  method: 'POST',
  headers: {
    'MCP-Protocol-Version': '2025-03-26',
    'Mcp-Session-Id': sessionId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(request)
});
```

### Krok 2: Aktualizace npm scripts

**Před:**
```bash
npm run mcp:sse
# nebo
npx -y freelo-mcp-sse
```

**Po:**
```bash
npm run mcp:http
# nebo
npx -y freelo-mcp-http
```

### Krok 3: Aktualizace environment proměnných

**Nové proměnné (volitelné):**
```bash
# Základní (stejné jako SSE)
FREELO_EMAIL=your@email.cz
FREELO_API_KEY=your_api_key
FREELO_USER_AGENT=FreeloMCP/2.4.0

# Nové pro HTTP transport
PORT=3000
```

### Krok 4: Aktualizace health check endpointu

**Před (SSE):**
```bash
curl http://localhost:3000/health
```

**Po (Streamable HTTP):**
```bash
curl http://localhost:3000/health
```

Response má nyní více informací:
```json
{
  "status": "ok",
  "service": "freelo-mcp-http",
  "version": "2.4.0",
  "transport": "streamable-http",
  "activeSessions": 2,
  "endpoints": {
    "mcp": "/mcp/v1/endpoint",
    "health": "/health"
  },
  "features": {
    "sessionManagement": true,
    "mcpProtocol": "2025-03-26"
  }
}
```

## Příklad: n8n workflow migrace

### Před (SSE)

**n8n HTTP Request Node:**
```json
{
  "url": "http://localhost:3000/message",
  "method": "POST",
  "headers": {
    "X-Session-ID": "{{$node[\"SSE Connection\"].json[\"sessionId\"]}}",
    "Content-Type": "application/json"
  },
  "body": {
    "jsonrpc": "2.0",
    "id": "{{$node[\"UUID\"].json[\"uuid\"]}}",
    "method": "tools/call",
    "params": {
      "name": "get_projects"
    }
  }
}
```

### Po (Streamable HTTP)

**n8n HTTP Request Node:**
```json
{
  "url": "http://localhost:3000/mcp/v1/endpoint",
  "method": "POST",
  "headers": {
    "MCP-Protocol-Version": "2025-03-26",
    "Mcp-Session-Id": "{{$node[\"Init Session\"].json[\"sessionId\"]}}",
    "Content-Type": "application/json"
  },
  "body": {
    "jsonrpc": "2.0",
    "id": "{{$node[\"UUID\"].json[\"uuid\"]}}",
    "method": "tools/call",
    "params": {
      "name": "get_projects"
    }
  }
}
```

## Časová osa migrace

- **v2.4.0** (aktuální): Streamable HTTP transport přidán
  - Všechny 3 transporty fungují (stdio, HTTP, SSE deprecated)
  - SSE označeno jako deprecated s warnings

- **v2.5.0 - v2.9.x** (přechodné období):
  - Doporučeno migrovat na Streamable HTTP
  - SSE stále podporováno s deprecation warnings
  - Nové projekty by měly používat pouze HTTP transport

- **v3.0.0** (budoucí major release):
  - SSE transport bude odstraněn
  - Pouze stdio a Streamable HTTP transporty
  - Breaking change vyžadující migraci všech SSE klientů

## Porovnání features

| Feature | SSE Transport | Streamable HTTP |
|---------|--------------|-----------------|
| **MCP Specifikace** | Deprecated | ✅ 2025-03-26 |
| **Session Management** | ✅ Ano | ✅ Ano (UUID) |
| **Endpoint** | `/sse` + `/message` | `/mcp/v1/endpoint` |
| **HTTP Methods** | GET + POST | GET + POST |
| **Headers** | `X-Session-ID` | `Mcp-Session-Id`, `MCP-Protocol-Version` |
| **Health Check** | ✅ `/health` | ✅ `/health` (enhanced) |
| **Future Support** | ❌ v3.0.0 removal | ✅ Long-term |

## Řešení běžných problémů

### Problem: "Session not found"

**Příčina:** Používáte starý session ID nebo session expirovala.

**Řešení:**
1. Inicializujte novou session pomocí `initialize` metody
2. Ujistěte se, že používáte header `Mcp-Session-Id` (ne `X-Session-ID`)
3. Session ID musí být UUID formát

### Problem: "MCP-Protocol-Version header missing"

**Příčina:** Neposíláte požadovaný header.

**Řešení:**
Přidejte header do všech requestů:
```javascript
headers: {
  'MCP-Protocol-Version': '2025-03-26',
  // ... ostatní headers
}
```

### Problem: "Invalid endpoint"

**Příčina:** Používáte staré SSE endpointy.

**Řešení:**
- ❌ `http://localhost:3000/sse`
- ❌ `http://localhost:3000/message`
- ✅ `http://localhost:3000/mcp/v1/endpoint`

## Testování migrace

1. **Spusťte HTTP server:**
```bash
npm run mcp:http
```

2. **Testujte health endpoint:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "freelo-mcp-http",
  "transport": "streamable-http"
}
```

3. **Testujte MCP inicializaci:**
```bash
curl -X POST http://localhost:3000/mcp/v1/endpoint \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-03-26" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'
```

4. **Ověřte session ID v response headers:**
```bash
# Session ID by mělo být v hlavičce Mcp-Session-Id
```

## Podpora

Pokud narazíte na problémy během migrace:

1. **Zkontrolujte příklady:**
   - `examples/streamable-http-client.js` - Příklad HTTP klienta
   - `test-http-transport.js` - Test skripty

2. **Zapněte debug logging:**
```bash
DEBUG=freelo-mcp:* npm run mcp:http
```

3. **Otevřete issue na GitHubu:**
   - https://github.com/karlost/FreeloMCP/issues
   - Uveďte verzi: freelo-mcp@2.4.0
   - Popište problém a chybové hlášky

4. **Konzultujte dokumentaci:**
   - [README.md](README.md) - Kompletní dokumentace
   - [AI_GUIDE.md](AI_GUIDE.md) - Transport selection guide
   - [MCP Spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports) - Oficiální specifikace

## Doporučení

✅ **DO:**
- Migrujte co nejdříve na Streamable HTTP
- Testujte migraci na dev prostředí před produkcí
- Používejte health endpoint pro monitoring
- Implementujte retry logiku pro session management

❌ **DON'T:**
- Nespouštějte SSE a HTTP transport současně na stejném portu
- Nepoužívejte SSE pro nové projekty
- Neočekávejte podporu SSE ve v3.0.0+
- Nemíchejte SSE a HTTP headers (např. `X-Session-ID` vs `Mcp-Session-Id`)

## Závěr

Migrace z SSE na Streamable HTTP transport je jednoduchá a přináší:

✅ Moderní MCP standard compliance
✅ Lepší session management
✅ Unified endpoint (`/mcp/v1/endpoint`)
✅ Enhanced health monitoring
✅ Dlouhodobá podpora

Doporučujeme provést migraci co nejdříve před plánovaným odstraněním SSE ve v3.0.0.
