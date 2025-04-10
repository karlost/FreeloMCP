# Freelo MCP Server

[![NPM Version](https://img.shields.io/npm/v/freelo-mcp.svg)](https://www.npmjs.com/package/freelo-mcp)
[![License](https://img.shields.io/npm/l/freelo-mcp.svg)](https://github.com/karlost/FreeloMCP/blob/main/LICENSE)

MCP Server pro Freelo API v1 - implementace proxy serveru pro komunikaci s Freelo API pomocí Model Context Protocol (MCP).

## O projektu

Freelo MCP Server poskytuje rozhraní pro komunikaci s Freelo API pomocí Model Context Protocol (MCP). Umožňuje integraci Freelo do AI asistentů jako je Cline, Claude a další, kteří podporují MCP protokol.

Projekt obsahuje dvě hlavní komponenty:

1. **REST API Server** - Tradiční REST API pro komunikaci s Freelo API
2. **MCP Server** - Server implementující Model Context Protocol pro použití s AI asistenty

## Instalace

### Lokální instalace

```bash
# Klonování repozitáře
git clone https://github.com/karlost/FreeloMCP.git
cd FreeloMCP

# Instalace závislostí
npm install
```

### Instalace jako npm balíček

```bash
# Globální instalace
npm install -g freelo-mcp

# Nebo použití bez instalace
npx freelo-mcp
```

## Konfigurace

Před použitím je potřeba nastavit proměnné prostředí pro autentizaci s Freelo API. Vytvořte soubor `.env` s následujícím obsahem:

```env
PORT=3000
NODE_ENV=development

# Freelo API authentication
FREELO_EMAIL=vas@email.cz
FREELO_API_KEY=VAS_API_KLIC
FREELO_USER_AGENT=freelo-mcp
```

## Spuštění

### REST API Server

```bash
# Vývojové prostředí
npm run dev

# Produkční prostředí
npm start
```

### MCP Server

```bash
# Vývojové prostředí
npm run mcp:dev

# Produkční prostředí
npm run mcp

# Pomocí npx (po instalaci balíčku)
freelo-mcp

# Pomocí npx (bez instalace)
npx freelo-mcp

# Lokální spuštění
node bin/freelo-mcp.js
```

## Integrace s Cline

Pro integraci s Cline vytvořte soubor `cline_mcp_settings.json` s následujícím obsahem:

```json
{
  "mcpServers": {
    "freelo-mcp": {
      "command": "node",
      "args": ["bin/freelo-mcp.js"],
      "env": {
        "NODE_ENV": "production",
        "FREELO_EMAIL": "vas@email.cz",
        "FREELO_API_KEY": "VAS_API_KLIC",
        "FREELO_USER_AGENT": "freelo-mcp"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Testování

```bash
npm test
```

## Struktura projektu

- `server.js` - Hlavní soubor REST API serveru
- `mcp-server.js` - Hlavní soubor MCP serveru
- `bin/freelo-mcp.js` - Spustitelný soubor pro npx
- `routes/` - Definice API endpointů pro REST API
- `controllers/` - Kontrolery pro zpracování požadavků
- `middleware/` - Middleware funkce (autentizace, validace, atd.)
- `utils/` - Pomocné funkce a nástroje
- `tests/` - Testy
- `cline_mcp_settings.json` - Konfigurační soubor pro Cline MCP

## Implementované endpointy REST API

Tyto endpointy jsou dostupné přes REST API server.

### Projects

- **POST /api/v1/projects** - Vytvoření projektu
- **GET /api/v1/projects** - Získání vlastních projektů (včetně tasklistů)
- **GET /api/v1/all-projects** - Získání všech projektů (vlastněné i pozvané)
- **GET /api/v1/invited-projects** - Získání pozvaných projektů
- **GET /api/v1/archived-projects** - Získání archivovaných projektů
- **GET /api/v1/template-projects** - Získání šablon projektů
- **GET /api/v1/user/{user_id}/all-projects** - Získání projektů uživatele
- **GET /api/v1/project/{project_id}/workers** - Správa pracovníků projektu
- **POST /api/v1/project/{project_id}/remove-workers/by-ids** - Odstranění pracovníků podle ID
- **POST /api/v1/project/{project_id}/remove-workers/by-emails** - Odstranění pracovníků podle emailů
- **POST /api/v1/project/{project_id}/archive** - Archivace projektu
- **POST /api/v1/project/{project_id}/activate** - Aktivace projektu
- **GET /api/v1/project/{project_id}** - Detail projektu
- **DELETE /api/v1/project/{project_id}** - Smazání projektu
- **POST /api/v1/project/create-from-template/{template_id}** - Vytvoření projektu ze šablony

### Pinned Items

- **GET /api/v1/project/{project_id}/pinned-items** - Získání všech připnutých položek v projektu
- **POST /api/v1/project/{project_id}/pinned-items** - Připnutí položky do projektu
- **DELETE /api/v1/pinned-item/{pinned_item_id}** - Smazání připnuté položky

### Tasklists

- **POST /api/v1/project/{project_id}/tasklists** - Vytvoření tasklistu v projektu
- **GET /api/v1/all-tasklists** - Získání všech tasklistů (globálně nebo dle projektu)
- **GET /api/v1/project/{project_id}/tasklist/{tasklist_id}/assignable-workers** - Získání přiřaditelných pracovníků pro tasklist
- **GET /api/v1/tasklist/{tasklist_id}** - Detail tasklistu
- **POST /api/v1/tasklist/create-from-template/{template_id}** - Vytvoření tasklistu ze šablony

### Tasks

- **POST /api/v1/project/{project_id}/tasklist/{tasklist_id}/tasks** - Vytvoření úkolu
- **GET /api/v1/project/{project_id}/tasklist/{tasklist_id}/tasks** - Získání úkolů v tasklistu
- **GET /api/v1/all-tasks** - Získání všech úkolů (globálně, s filtry)
- **GET /api/v1/tasklist/{tasklist_id}/finished-tasks** - Získání dokončených úkolů v tasklistu
- **POST /api/v1/task/{task_id}/activate** - Aktivace úkolu
- **POST /api/v1/task/{task_id}/finish** - Dokončení úkolu
- **POST /api/v1/task/{task_id}/move/{tasklist_id}** - Přesun úkolu
- **GET /api/v1/task/{task_id}** - Detail úkolu
- **POST /api/v1/task/{task_id}** - Editace úkolu
- **DELETE /api/v1/task/{task_id}** - Smazání úkolu
- **GET /api/v1/task/{task_id}/description** - Získání popisu úkolu
- **POST /api/v1/task/{task_id}/description** - Aktualizace popisu úkolu
- **POST /api/v1/task/{task_id}/reminder** - Vytvoření připomínky úkolu
- **DELETE /api/v1/task/{task_id}/reminder** - Smazání připomínky úkolu
- **GET /api/v1/public-link/task/{task_id}** - Získání veřejného odkazu na úkol
- **DELETE /api/v1/public-link/task/{task_id}** - Smazání veřejného odkazu na úkol
- **POST /api/v1/task/create-from-template/{template_id}** - Vytvoření úkolu ze šablony
- **POST /api/v1/task/{task_id}/total-time-estimate** - Vytvoření celkového odhadu času
- **DELETE /api/v1/task/{task_id}/total-time-estimate** - Smazání celkového odhadu času
- **POST /api/v1/task/{task_id}/users-time-estimates/{user_id}** - Vytvoření uživatelského odhadu času
- **DELETE /api/v1/task/{task_id}/users-time-estimates/{user_id}** - Smazání uživatelského odhadu času

### Subtasks

- **GET /api/v1/task/{task_id}/subtasks** - Získání podúkolů v úkolu
- **POST /api/v1/task/{task_id}/subtasks** - Vytvoření podúkolu

### Task Labels

- **POST /api/v1/task-labels** - Vytvoření štítků úkolů
- **POST /api/v1/task-labels/add-to-task/{task_id}** - Přidání štítků k úkolu
- **POST /api/v1/task-labels/remove-from-task/{task_id}** - Odstranění štítků z úkolu

## Autentizace

### REST API

Autentizace probíhá pomocí HTTP Basic Authentication. Jako uživatelské jméno se používá email pro přihlášení do Freelo a jako heslo API klíč.

Každý požadavek musí obsahovat hlavičku User-Agent.

### Autentizace v MCP

Při použití MCP serveru je autentizace možná dvěma způsoby:

1. **Pomocí proměnných prostředí**:
   - Nastavte proměnné prostředí `FREELO_EMAIL`, `FREELO_API_KEY` a `FREELO_USER_AGENT` v souboru `.env` nebo v `cline_mcp_settings.json`
   - Nástroje pak automaticky použijí tyto hodnoty

2. **Pomocí parametrů nástroje**:
   - Každý nástroj přijímá volitelné parametry:
     - `email` - Email pro přihlášení do Freelo
     - `apiKey` - API klíč
     - `userAgent` - Identifikace aplikace
   - Tyto parametry přepíší hodnoty z proměnných prostředí, pokud jsou zadány

## Implementované MCP nástroje (tools)

MCP server poskytuje následující nástroje pro práci s Freelo API:

| Kategorie | Nástroj | Popis |
|-----------|---------|-------|
| **Projekty** | `get_projects` | Získání vlastních projektů |
| | `get_all_projects` | Získání všech projektů |
| **Úkoly** | `get_all_tasks` | Získání všech úkolů (globálně, s filtry) |
| | `create_task` | Vytvoření nového úkolu v tasklistu |
| | `get_task_details` | Získání detailu konkrétního úkolu |
| | `edit_task` | Úprava existujícího úkolu |
| | `delete_task` | Smazání úkolu |
| **Tasklisty** | `get_project_tasklists` | Získání taskistů pro projekt |
| | `create_tasklist` | Vytvoření nového tasklistu v projektu |
| **Uživatelé** | `get_users` | Získání seznamu všech uživatelů |
| **Soubory** | `get_all_files` | Získání seznamu všech souborů a dokumentů |
| **Podúkoly** | `create_subtask` | Vytvoření nového podúkolu k úkolu |
| | `get_subtasks` | Získání seznamu podúkolů úkolu |
| **Komentáře** | `create_comment` | Přidání komentáře k úkolu |

## Příspěvky a další vývoj

Pokud chcete přispět k vývoji tohoto projektu, můžete vytvořit pull request nebo otevřít issue na GitHubu.

Návrhy na další vývoj:

- Implementace dalších MCP nástrojů pro pokrytí všech funkcí Freelo API
- Vylepšení dokumentace a příkladů použití
- Přidání podpory pro další funkce Freelo API (notifikace, štítky, atd.)

## Licence

Tento projekt je licencován pod licencí MIT.

## Autor

Chodeec (karlost)
