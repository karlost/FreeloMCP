# Freelo MCP Server (Neoficiální)

> **Upozornění:** Toto je neoficiální komunitní projekt a není přímo podporován společností Freelo.

<p align="center">
  <a href="https://www.freelo.io/cs">
    <img src="logo.png" alt="Freelo Logo" width="300">
  </a>
</p>

[![NPM Version](https://img.shields.io/npm/v/freelo-mcp.svg)](https://www.npmjs.com/package/freelo-mcp)
[![License](https://img.shields.io/npm/l/freelo-mcp.svg)](https://github.com/karlost/FreeloMCP/blob/main/LICENSE)

MCP Server pro [Freelo](https://www.freelo.io/cs) API v1 - implementace proxy serveru pro komunikaci s Freelo API pomocí Model Context Protocol (MCP). Freelo je česká služba pro projektové řízení a správu úkolů.

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

Před použitím je potřeba nastavit proměnné prostředí pro autentizaci s Freelo API. Existují dvě možnosti konfigurace:

### 1. Pomocí souboru `.env`

Vytvořte soubor `.env` v kořenovém adresáři projektu s následujícím obsahem:

```env
# Volitelné nastavení serveru
PORT=3000
NODE_ENV=development

# Povinné autentizační údaje pro Freelo API
FREELO_EMAIL=vas@email.cz
FREELO_API_KEY=VAS_API_KLIC
FREELO_USER_AGENT=freelo-mcp
```

### 2. Přímo pomocí proměnných prostředí

Můžete také nastavit proměnné prostředí přímo při spuštění:

```bash
FREELO_EMAIL=vas@email.cz FREELO_API_KEY=VAS_API_KLIC FREELO_USER_AGENT=freelo-mcp node mcp-server.js
```

### Požadavky na systém

- Node.js verze 18.0.0 nebo vyšší

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

Pro integraci s [Cline](https://www.cline.ai/) (AI asistent podporující MCP) vytvořte soubor `cline_mcp_settings.json` ve vašem domovském adresáři s následujícím obsahem:

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

Ujistěte se, že:

1. Cesta k souboru `bin/freelo-mcp.js` je správná (může se lišit podle způsobu instalace)
2. Autentizační údaje (`FREELO_EMAIL`, `FREELO_API_KEY`) jsou správné
3. Po nastavení restartujte Cline, aby se změny projevily

## Testování

Projekt obsahuje automatizované testy pro ověření funkčnosti MCP nástrojů. Testy používají mockování API pomocí knihovny `nock` a nepotřebují reálné přihlašovací údaje.

### Spuštění všech testů

```bash
npm test
```

### Spuštění konkrétního testu

```bash
npm test -- tests/mcp-tools-simple.test.js
```

### Spuštění testů s pokrytím kódu

```bash
npm test -- --coverage
```

## Autentizace

### REST API

Autentizace probíhá pomocí HTTP Basic Authentication. Jako uživatelské jméno se používá email pro přihlášení do Freelo a jako heslo API klíč.

Každý požadavek musí obsahovat hlavičku User-Agent.

### Autentizace v MCP

Při použití MCP serveru je autentizace prováděna výhradně pomocí proměnných prostředí:

- Nastavte proměnné prostředí `FREELO_EMAIL`, `FREELO_API_KEY` a `FREELO_USER_AGENT` v souboru `.env` nebo v `cline_mcp_settings.json`
- Všechny MCP nástroje automaticky použijí tyto hodnoty pro autentizaci s Freelo API
- Není potřeba předávat autentizační údaje v každém požadavku

## Dostupné MCP nástroje

Následující tabulka zobrazuje stav implementace jednotlivých MCP nástrojů na základě posledního testování:

| Kategorie | Nástroj | Popis | Stav | Poznámka |
|-----------|---------|-------|------|----------|
| **Projekty** | `get_projects` | Získání vlastních projektů | ✅ |  |
| | `get_all_projects` | Získání všech projektů | ✅ |  |
| | `create_project` | Vytvoření nového projektu | ✅ |  |
| | `get_project_details` | Získání detailu projektu | ✅ |  |
| | `archive_project` | Archivace projektu | ✅ |  |
| | `activate_project` | Aktivace projektu | ✅ |  |
| | `delete_project` | Smazání projektu | ✅ |  |
| **Úkoly** | `get_all_tasks` | Získání všech úkolů (globálně, s filtry) | ⚠️ | Vrací úkoly ze všech projektů i při použití filtru `projectId`. |
| | `create_task` | Vytvoření nového úkolu v tasklistu | ✅ |  |
| | `get_task_details` | Získání detailu konkrétního úkolu | ✅ |  |
| | `edit_task` | Úprava existujícího úkolu | ✅ |  |
| | `delete_task` | Smazání úkolu | ✅ |  |
| | `finish_task` | Dokončení úkolu | ✅ |  |
| | `activate_task` | Aktivace úkolu | ✅ |  |
| **Tasklisty** | `get_project_tasklists` | Získání taskistů pro projekt | ✅ |  |
| | `create_tasklist` | Vytvoření nového tasklistu v projektu | ✅ |  |
| | `get_tasklist_tasks` | Získání úkolů v tasklistu | ✅ |  |
| **Uživatelé** | `get_users` | Získání seznamu všech uživatelů | ✅ |  |
| | `remove_workers` | Odstranění pracovníků z projektu | ❌ | Selhává s chybou 404. |
| **Soubory** | `get_all_files` | Získání seznamu všech souborů a dokumentů | ✅ |  |
| | `upload_file` | Nahrání souboru | ❌ | Selhává s chybou `TypeError` (očekává Blob místo Base64). |
| | `download_file` | Stažení souboru | ❓ | Netestováno (závisí na `upload_file`). |
| **Podúkoly** | `create_subtask` | Vytvoření nového podúkolu k úkolu | ⚠️ | Vrací nesprávné `task_id` v odpovědi. |
| | `get_subtasks` | Získání seznamu podúkolů úkolu | ⚠️ | Vrací podúkoly z celého projektu místo filtrování dle `taskId`. |
| **Komentáře** | `create_comment` | Přidání komentáře k úkolu | ✅ |  |
| | `edit_comment` | Úprava komentáře | ✅ |  |
| **Štítky** | `add_labels_to_task` | Přidání štítků k úkolu | ✅ |  |
| | `remove_labels_from_task` | Odstranění štítků z úkolu | ✅ |  |

**Legenda:**
- ✅: Funkční
- ⚠️: Funkční s problémy/neočekávaným chováním
- ❌: Nefunkční
- ❓: Netestováno

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
