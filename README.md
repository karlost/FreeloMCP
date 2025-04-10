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

## Dostupné MCP nástroje

Podrobný přehled všech nástrojů a jejich stavu implementace je uveden v sekci [Stav implementace MCP nástrojů](#stav-implementace-mcp-nástrojů) níže.

## Chybějící funkce

Následující funkce ještě nejsou implementovány v MCP serveru:

- [ ] Podúkoly - kompletní správa podúkolů (editace, mazání)
- [ ] Editace a mazání úkolů - rozšířená funkcionalita
- [ ] Vytváření tasklistů - kompletní implementace
- [ ] Přiřazování uživatelů - správa uživatelů v projektech a úkolech
- [ ] Komentáře - kompletní implementace komentářů k úkolům
- [ ] Přílohy - nahrávání a správa příloh
- [ ] Štítky - kompletní implementace štítků pro úkoly
- [ ] Pokročilé filtrování - implementace všech filtrovacích možností
- [ ] Detailní pohledy - implementace různých pohledů na data
- [ ] Odhady času - správa odhadů času pro úkoly
- [ ] Notifikace - implementace notifikací
- [ ] Připnuté položky - správa připnutých položek v projektech
- [ ] Veřejné odkazy - vytváření a správa veřejných odkazů
- [ ] Vlastní pole - implementace vlastních polí pro úkoly
- [ ] Archivace a aktivace - správa stavu projektů a úkolů

## Stav implementace MCP nástrojů

Následující tabulka zobrazuje stav implementace jednotlivých MCP nástrojů:

| Kategorie | Nástroj | Popis | Stav |
|-----------|---------|-------|------|
| **Projekty** | `get_projects` | Získání vlastních projektů | ✅ |
| | `get_all_projects` | Získání všech projektů | ✅ |
| | `create_project` | Vytvoření nového projektu | ❌ |
| | `get_project_details` | Získání detailu projektu | ❌ |
| | `archive_project` | Archivace projektu | ❌ |
| | `activate_project` | Aktivace projektu | ❌ |
| | `delete_project` | Smazání projektu | ❌ |
| **Úkoly** | `get_all_tasks` | Získání všech úkolů (globálně, s filtry) | ✅ |
| | `create_task` | Vytvoření nového úkolu v tasklistu | ✅ |
| | `get_task_details` | Získání detailu konkrétního úkolu | ✅ |
| | `edit_task` | Úprava existujícího úkolu | ✅ |
| | `delete_task` | Smazání úkolu | ❌ |
| | `finish_task` | Dokončení úkolu | ❌ |
| | `activate_task` | Aktivace úkolu | ❌ |
| | `move_task` | Přesun úkolu do jiného tasklistu | ❌ |
| **Tasklisty** | `get_project_tasklists` | Získání taskistů pro projekt | ✅ |
| | `create_tasklist` | Vytvoření nového tasklistu v projektu | ❌ |
| | `get_tasklist_details` | Získání detailu tasklistu | ❌ |
| **Uživatelé** | `get_users` | Získání seznamu všech uživatelů | ✅ |
| | `get_project_workers` | Získání pracovníků projektu | ❌ |
| | `remove_workers` | Odstranění pracovníků z projektu | ❌ |
| **Soubory** | `get_all_files` | Získání seznamu všech souborů a dokumentů | ✅ |
| | `upload_file` | Nahrání souboru | ❌ |
| | `download_file` | Stažení souboru | ❌ |
| **Podúkoly** | `create_subtask` | Vytvoření nového podúkolu k úkolu | ❌ |
| | `get_subtasks` | Získání seznamu podúkolů úkolu | ❌ |
| | `edit_subtask` | Úprava podúkolu | ❌ |
| | `delete_subtask` | Smazání podúkolu | ❌ |
| **Komentáře** | `create_comment` | Přidání komentáře k úkolu | ❌ |
| | `get_task_comments` | Získání komentářů k úkolu | ❌ |
| | `edit_comment` | Úprava komentáře | ❌ |
| | `delete_comment` | Smazání komentáře | ❌ |
| **Štítky** | `create_label` | Vytvoření štítku | ❌ |
| | `add_label_to_task` | Přidání štítku k úkolu | ❌ |
| | `remove_label_from_task` | Odstranění štítku z úkolu | ❌ |
| **Odhady času** | `set_time_estimate` | Nastavení odhadu času | ❌ |
| | `delete_time_estimate` | Smazání odhadu času | ❌ |

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
