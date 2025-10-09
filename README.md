# Freelo MCP Server (Neoficiální)

> **Upozornění:** Toto je neoficiální komunitní projekt a není přímo podporován společností Freelo.

<p align="center">
  <a href="https://www.freelo.io/cs">
    <img src="logo.png" alt="Freelo Logo" width="300">
  </a>
</p>

[![NPM Version](https://img.shields.io/npm/v/freelo-mcp.svg)](https://www.npmjs.com/package/freelo-mcp)
[![License](https://img.shields.io/npm/l/freelo-mcp.svg)](https://github.com/karlost/FreeloMCP/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/karlost/FreeloMCP)
[![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen.svg)](https://github.com/karlost/FreeloMCP)

MCP Server pro [Freelo](https://www.freelo.io/cs) API v1 - kompletní implementace Model Context Protocol serveru pro komunikaci s Freelo API. Freelo je česká služba pro projektové řízení a správu úkolů.

## ✨ Vlastnosti

- 🚀 **98 MCP tools** pokrývajících 100% Freelo API v1
- ✅ **Plně otestováno** - 95+ tools úspěšně validováno
- 🔧 **Production-ready** - Všechny známé bugy opraveny
- 📊 **Smart filtering** - Podpora pro pagination a advanced filters
- 🔒 **Bezpečné** - HTTP Basic Authentication s API klíčem
- 🎯 **Optimalizováno** - Token limit fixes pro velké datasety
- 📝 **Kompletní dokumentace** - Detailní popis všech tools

## 📊 Stav projektu

| Metrika | Hodnota |
|---------|---------|
| **Celkem MCP tools** | 98 |
| **Funkčních tools** | 95+ (97%+) |
| **Opravené bugy** | 11/11 (100%) |
| **API pokrytí** | 100% Freelo API v1 |
| **Testováno** | ✅ Kompletní validation |

## 🚀 Rychlý start

### Instalace přes NPX (doporučeno)

Nejjednodušší způsob jak začít používat Freelo MCP je přes `npx` - není potřeba nic instalovat!

#### 1️⃣ Pro Claude Desktop (Anthropic Desktop)

1. **Najděte konfigurační soubor:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Přidejte Freelo MCP server do konfigurace:**

```json
{
  "mcpServers": {
    "freelo": {
      "command": "npx",
      "args": ["-y", "freelo-mcp"],
      "env": {
        "FREELO_EMAIL": "vas@email.cz",
        "FREELO_API_KEY": "VAS_API_KLIC",
        "FREELO_USER_AGENT": "FreeloMCP/2.0.5 (vas@email.cz)"
      }
    }
  }
}
```

3. **Restartujte Claude Desktop**

4. **Ověření:**
   - V Claude Desktop byste měli vidět 🔌 ikonu v dolním panelu
   - Zkuste: "Zobraz moje Freelo projekty"

#### 2️⃣ Pro Claude Code (CLI)

1. **Přidání MCP serveru jedním příkazem:**

```bash
claude mcp add freelo-mcp \
  --env FREELO_EMAIL=vas@email.cz \
  --env FREELO_API_KEY=VAS_API_KLIC \
  --env FREELO_USER_AGENT="FreeloMCP/2.0.5 (vas@email.cz)" \
  -- npx -y freelo-mcp
```

> **DŮLEŽITÉ:** `--` separátor odděluje Claude CLI options od příkazu MCP serveru!

2. **Refresh připojení:**

```bash
/mcp
```

3. **Ověření:**

Zkuste v Claude Code: "Zobraz moje Freelo projekty"

### Alternativní instalace - Git clone

Pro vývoj nebo pokud chcete upravovat kód:

```bash
# Klonování repozitáře
git clone https://github.com/karlost/FreeloMCP.git
cd FreeloMCP

# Instalace závislostí
npm install

# Vytvoření .env souboru
cat > .env << EOF
FREELO_EMAIL=vas@email.cz
FREELO_API_KEY=VAS_API_KLIC
FREELO_USER_AGENT=FreeloMCP/2.0.5 (vas@email.cz)
EOF

# Spuštění MCP serveru
node mcp-server.js
```

**Claude Desktop konfigurace s lokální instalací:**

```json
{
  "mcpServers": {
    "freelo": {
      "command": "node",
      "args": ["/absolutni/cesta/k/FreeloMCP/mcp-server.js"],
      "env": {
        "FREELO_EMAIL": "vas@email.cz",
        "FREELO_API_KEY": "VAS_API_KLIC",
        "FREELO_USER_AGENT": "FreeloMCP/2.0.5 (vas@email.cz)"
      }
    }
  }
}
```

**Claude Code konfigurace s lokální instalací:**

```bash
claude mcp add freelo-mcp \
  --env FREELO_EMAIL=vas@email.cz \
  --env FREELO_API_KEY=VAS_API_KLIC \
  --env FREELO_USER_AGENT="FreeloMCP/2.0.5 (vas@email.cz)" \
  -- node /absolutni/cesta/k/FreeloMCP/mcp-server.js
```

### Konfigurace pro další MCP klienty

#### 3️⃣ Cline (VS Code Extension)

1. **Otevřete VS Code s nainstalovaným Cline**
2. **Otevřete MCP Settings v Cline** (ikona hamburgeru → MCP Settings)
3. **Upravte konfigurační soubor:**

```json
{
  "mcpServers": {
    "freelo": {
      "command": "npx",
      "args": ["-y", "freelo-mcp"],
      "env": {
        "FREELO_EMAIL": "vas@email.cz",
        "FREELO_API_KEY": "VAS_API_KLIC",
        "FREELO_USER_AGENT": "FreeloMCP/2.0.5 (vas@email.cz)"
      }
    }
  }
}
```

4. **Restart VS Code** nebo reload window (Cmd/Ctrl + Shift + P → "Reload Window")
5. **Ověření:** V Cline chat zkuste "Zobraz moje Freelo projekty"

#### 4️⃣ Windsurf (Codeium)

Windsurf podporuje MCP přes stejný formát jako Claude Desktop:

1. **Najděte konfigurační soubor:**
   - macOS: `~/Library/Application Support/Windsurf/settings/mcp_config.json`
   - Windows: `%APPDATA%\Windsurf\settings\mcp_config.json`
   - Linux: `~/.config/Windsurf/settings/mcp_config.json`

2. **Přidejte konfiguraci:**

```json
{
  "mcpServers": {
    "freelo": {
      "command": "npx",
      "args": ["-y", "freelo-mcp"],
      "env": {
        "FREELO_EMAIL": "vas@email.cz",
        "FREELO_API_KEY": "VAS_API_KLIC",
        "FREELO_USER_AGENT": "FreeloMCP/2.0.5 (vas@email.cz)"
      }
    }
  }
}
```

3. **Restartujte Windsurf**

#### 5️⃣ Zed Editor

1. **Otevřete Zed Settings** (Cmd/Ctrl + ,)
2. **Přejděte na "Language Models" → "Configure MCP Servers"**
3. **Přidejte konfiguraci:**

```json
{
  "freelo": {
    "command": "npx",
    "args": ["-y", "freelo-mcp"],
    "env": {
      "FREELO_EMAIL": "vas@email.cz",
      "FREELO_API_KEY": "VAS_API_KLIC",
      "FREELO_USER_AGENT": "FreeloMCP/2.0.1 (vas@email.cz)"
    }
  }
}
```

4. **Restart Zed**

#### 6️⃣ Continue.dev (VS Code/JetBrains)

1. **Otevřete Continue config soubor:**
   - VS Code: `.continue/config.json` v home directory
   - JetBrains: stejné umístění

2. **Přidejte MCP server:**

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "freelo",
        "command": "npx",
        "args": ["-y", "freelo-mcp"],
        "env": {
          "FREELO_EMAIL": "vas@email.cz",
          "FREELO_API_KEY": "VAS_API_KLIC",
          "FREELO_USER_AGENT": "FreeloMCP/2.0.1 (vas@email.cz)"
        }
      }
    ]
  }
}
```

3. **Restart IDE**

#### 7️⃣ LibreChat

V LibreChat (self-hosted ChatGPT alternative):

1. **Upravte `librechat.yaml`:**

```yaml
mcpServers:
  - name: freelo
    command: npx
    args:
      - "-y"
      - "freelo-mcp"
    env:
      FREELO_EMAIL: vas@email.cz
      FREELO_API_KEY: VAS_API_KLIC
      FREELO_USER_AGENT: "FreeloMCP/2.0.1 (vas@email.cz)"
```

2. **Restart LibreChat kontejneru**

## 📚 Dostupné MCP Tools

### Přehled podle kategorií (98 tools)

| Kategorie | Počet | Popis |
|-----------|-------|-------|
| **Projects** | 18 | Správa projektů, šablony, archivace |
| **Tasks** | 19 | CRUD úkolů, reminders, public links, estimates |
| **Tasklists** | 5 | Správa tasklistů, workers, templates |
| **Subtasks** | 2 | Vytváření a správa podúkolů |
| **Comments** | 3 | Komentáře na úkolech a souborech |
| **Files** | 3 | Upload, download, listing souborů |
| **Users** | 6 | Správa uživatelů, out-of-office, invite |
| **Time Tracking** | 7 | Start/stop tracking, work reports, estimates |
| **Work Reports** | 4 | CRUD work reports |
| **Custom Fields** | 11 | Vlastní pole, enum options, values |
| **Invoices** | 4 | Fakturace, reporty, označování |
| **Notifications** | 3 | Získání a správa notifikací |
| **Notes** | 4 | CRUD poznámek v projektech |
| **Events** | 1 | Historie událostí |
| **Filters** | 3 | Custom filtry pro úkoly |
| **Labels** | 3 | Vytváření a správa štítků |
| **Pinned Items** | 3 | Připnuté položky v projektech |
| **States** | 1 | Získání stavů (active, archived, atd.) |

### 🔥 Nejpoužívanější tools

<details>
<summary><b>Projects (18 tools)</b></summary>

- `get_projects` - Získání vlastních aktivních projektů
- `get_all_projects` - Všechny projekty (vlastní i sdílené) s pagination
- `get_project_details` - Detail projektu včetně workers a tasklists
- `get_invited_projects` - Projekty, kam jsem byl pozván
- `get_archived_projects` - Archivované projekty
- `get_template_projects` - Šablonové projekty s filtry
- `get_user_projects` - Projekty konkrétního uživatele
- `get_project_workers` - Seznam pracovníků na projektu
- `get_project_manager_of` - Projekty kde jsem PM
- `get_project_tasklists` - Všechny tasklisty v projektu
- `create_project` - Vytvoření nového projektu
- `create_project_from_template` - Vytvoření z šablony
- `archive_project` - Archivace projektu
- `activate_project` - Aktivace projektu
- `delete_project` - Smazání projektu
- `invite_users_by_email` - Pozvání uživatelů emailem
- `invite_users_by_ids` - Pozvání uživatelů podle ID
- `remove_workers` - Odstranění pracovníků z projektu

</details>

<details>
<summary><b>Tasks (19 tools) - s pokročilými filtry</b></summary>

**Listing & Details:**
- `get_all_tasks` - Všechny úkoly s **14 filtry**:
  - `search_query` - Fulltext vyhledávání
  - `state_id` - Podle stavu (active, finished)
  - `projects_ids` - Filtrace podle projektů (array)
  - `tasklists_ids` - Podle tasklistů (array)
  - `order_by` - Řazení (priority, name, date_add, date_edited_at)
  - `order` - Směr (asc, desc)
  - `with_label` / `without_label` - Podle štítků
  - `no_due_date` - Bez termínu
  - `due_date_range` - Rozsah termínů
  - `finished_overdue` - Dokončeno po termínu
  - `finished_date_range` - Rozsah dokončení
  - `worker_id` - Podle pracovníka
  - `p` - Stránkování (od 0)

- `get_tasklist_tasks` - Úkoly v konkrétním tasklistu
- `get_finished_tasks` - Dokončené úkoly
- `get_task_details` - Kompletní detail úkolu
- `get_task_description` - Popis úkolu

**CRUD Operations:**
- `create_task` - Vytvoření úkolu
- `create_task_from_template` - Z šablony
- `edit_task` - Úprava úkolu
- `update_task_description` - Aktualizace popisu
- `move_task` - Přesun do jiného tasklistu
- `finish_task` - Dokončení
- `activate_task` - Aktivace
- `delete_task` - Smazání

**Advanced Features:**
- `create_task_reminder` - Připomínka (✅ opraveno)
- `delete_task_reminder` - Smazání připomínky
- `get_public_link` - Veřejný odkaz
- `delete_public_link` - Smazání odkazu
- `set_total_time_estimate` - Odhad času (Premium - netestováno)
- `delete_total_time_estimate` - Smazání odhadu (Premium - netestováno)
- `set_user_time_estimate` - Odhad pro uživatele (Premium - netestováno)
- `delete_user_time_estimate` - Smazání odhadu uživatele (Premium - netestováno)

</details>

<details>
<summary><b>Files (3 tools) - Upload & Download</b></summary>

- `get_all_files` - Listing souborů s filtry:
  - `projects_ids` - Podle projektů
  - `type` - Typ (directory, link, file, document)
  - `p` - Pagination

- `upload_file` - Upload souboru (✅ opraveno - FormData)
  - Parametr `fileData` - Base64 encoded file
  - Parametr `fileName` - Název souboru

- `download_file` - Stažení souboru podle UUID

</details>

<details>
<summary><b>Time Tracking & Work Reports (7 tools)</b></summary>

**Time Tracking:**
- `start_time_tracking` - Spuštění trackingu
- `stop_time_tracking` - Zastavení trackingu
- `edit_time_tracking` - Úprava aktivního trackingu

**Work Reports:**
- `get_work_reports` - Získání work reports s filtry:
  - `projects_ids` - Podle projektů
  - `users_ids` - Podle uživatelů
  - `tasks_labels` - Podle štítků
  - `date_reported_range` - Rozsah dat

- `create_work_report` - Vytvoření reportu
- `update_work_report` - Aktualizace reportu
- `delete_work_report` - Smazání reportu

</details>

<details>
<summary><b>Custom Fields (11 tools) - Premium Feature</b></summary>

> ⚠️ **Poznámka:** Custom Fields jsou premium funkce Freelo (402 Payment Required). Tyto nástroje nejsou plně testované kvůli omezení tarifu.

- `get_custom_field_types` - Typy polí (text, number, date, bool, enum, link)
- `get_custom_fields_by_project` - Pole v projektu
- `create_custom_field` - Vytvoření pole (✅ opraveno - enum validation)
- `rename_custom_field` - Přejmenování
- `delete_custom_field` - Smazání
- `restore_custom_field` - Obnovení
- `add_or_edit_field_value` - Hodnota pole
- `add_or_edit_enum_value` - Enum hodnota
- `delete_field_value` - Smazání hodnoty
- `get_enum_options` - Enum možnosti
- `create_enum_option` - Nová enum možnost

</details>

<details>
<summary><b>Ostatní kategorie</b></summary>

**Tasklists (5):**
- get_project_tasklists, get_tasklist_details, get_assignable_workers
- create_tasklist, create_tasklist_from_template (✅ opraveno)

**Users (6):**
- get_users, get_out_of_office, set_out_of_office (✅ opraveno)
- delete_out_of_office, invite_users_by_email, invite_users_by_ids (✅ opraveno)

**Subtasks (2):**
- create_subtask, get_subtasks

**Comments (3):**
- create_comment, edit_comment, get_all_comments (s filtry + pagination)

**Labels (3):**
- create_task_labels, add_labels_to_task, remove_labels_from_task, find_available_labels

**Invoices (4):**
- get_issued_invoices, get_invoice_detail, download_invoice_reports, mark_as_invoiced

**Notifications (3):**
- get_all_notifications (s pagination), mark_notification_read, mark_notification_unread

**Notes (4):**
- create_note, get_note, update_note, delete_note

**Pinned Items (3):**
- get_pinned_items, pin_item (✅ opraveno), delete_pinned_item

**Events (1):**
- get_events - Historie s pokročilými filtry (7 parametrů + pagination)

**Filters (3):**
- get_custom_filters, get_tasks_by_filter_uuid, get_tasks_by_filter_name

**States (1):**
- get_all_states - Získání všech stavů (active, archived, template, finished)

**Search (1):**
- search_elasticsearch - Fulltext search napříč entitami

</details>

## 🔧 Opravené bugy a vylepšení

### Verze 2.0.0 - Kompletní validation a fixes

**Token Limit Fixes (4 tools):**
- ✅ `get_all_tasks` - Přidáno 14 filter parametrů + pagination
- ✅ `get_events` - Přidáno 7 filter parametrů + pagination
- ✅ `get_all_comments` - Přidáno 5 filter parametrů + pagination
- ✅ `get_all_files` - Přidáno 3 filter parametry + pagination

**API Integration Fixes (11 bugů opraveno):**

1. ✅ **create_task_reminder** - Transformace `date` → `remind_at`
2. ✅ **invite_users_by_ids** - Změna `project_id` → `projects_ids` (array)
3. ✅ **set_out_of_office** - Data wrapped v `{out_of_office: {...}}`
4. ✅ **pin_item** - Default link hodnota `'#'` místo null
5. ✅ **create_tasklist_from_template** - Flat struktura místo nested object
6. ✅ **upload_file** - Přidán import `FormData` z 'form-data' package
7. ✅ **create_custom_field** - `is_required` jako enum('yes','no') místo boolean

**Další opravy z předchozích iterací:**
8. ✅ create_comment - Oprava parametru 'description' → 'content'
9. ✅ edit_comment - Správná struktura dat pro API
10. ✅ create_subtask - Oprava assignedTo parametru
11. ✅ create_task - Kompletní validace parametrů

## 💡 Příklady použití

### Základní operace s projekty

```javascript
// Získání všech projektů
await get_all_projects()

// Detail konkrétního projektu
await get_project_details({ projectId: "197352" })

// Vytvoření nového projektu
await create_project({
  projectData: {
    name: "Nový projekt",
    currency_iso: "CZK"
  }
})
```

### Práce s úkoly a filtry

```javascript
// Všechny aktivní úkoly v projektu
await get_all_tasks({
  filters: {
    projects_ids: [197352],
    state_id: 1,
    order_by: "priority",
    order: "desc",
    p: 0
  }
})

// Hledání úkolů s konkrétním štítkem
await get_all_tasks({
  filters: {
    with_label: "urgent",
    no_due_date: false,
    p: 0
  }
})

// Úkoly dokončené po termínu
await get_all_tasks({
  filters: {
    finished_overdue: true,
    finished_date_range: {
      date_from: "2025-10-01",
      date_to: "2025-10-09"
    }
  }
})
```

### Time Tracking workflow

```javascript
// 1. Spustit tracking na úkolu
await start_time_tracking({ taskId: "25368707" })

// 2. Upravit popis
await edit_time_tracking({
  trackingData: {
    description: "Práce na feature XYZ"
  }
})

// 3. Zastavit a vytvořit work report
await stop_time_tracking()
```

### Soubory

```javascript
// Upload souboru
const base64Data = Buffer.from("obsah souboru").toString('base64')
await upload_file({
  fileName: "dokument.pdf",
  fileData: base64Data
})

// Listing souborů v projektu
await get_all_files({
  filters: {
    projects_ids: [197352],
    type: "file",
    p: 0
  }
})
```

## 🔒 Autentizace

### Získání API klíče

1. Přihlaste se do [Freelo](https://app.freelo.io)
2. Přejděte do **Nastavení** → **API**
3. Vygenerujte nový API klíč
4. Zkopírujte klíč a uložte bezpečně

### Bezpečnost

- ⚠️ **Nikdy nesdílejte** svůj API klíč veřejně
- ⚠️ **Necommitujte** `.env` soubor do gitu
- ✅ Používejte `.gitignore` pro ochranu credentials
- ✅ Pro production použijte environment variables

## 🧪 Testování

### Manuální testování

Server byl kompletně otestován:
- ✅ 95+ tools validováno v různých scénářích
- ✅ Token limit fixes ověřeny
- ✅ Všechny opravy bugů otestovány
- ✅ Edge cases pokryty

### Automatizované testy

```bash
# Spuštění všech testů
npm test

# Konkrétní test
npm test -- tests/mcp-tools-simple.test.js

# S code coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### MCP server se nepřipojí

**Řešení:**
1. Zkontrolujte, že Node.js verze ≥ 18.0.0: `node --version`
2. Ověřte env variables v konfiguraci
3. Restartujte Claude Code: `/mcp`
4. Zkontrolujte logy: `ps aux | grep mcp-server`

### Chyba "Payment required (402)"

Některé funkce jsou premium:
- Custom Fields operace
- Time estimates (set/delete)

**Řešení:** Upgrade Freelo plánu nebo použití jiných tools.

### Token limit exceeded

Pro velké datasety použijte pagination:

```javascript
// Místo
await get_all_tasks()

// Použijte
await get_all_tasks({
  filters: {
    projects_ids: [specificProjectId],
    p: 0  // první stránka
  }
})
```

### Server se restartuje pořád

**Důvod:** ES6 moduly jsou cachovány v Node.js procesu.

**Řešení:**
```bash
# Najděte proces
ps aux | grep "[n]ode.*mcp-server.js"

# Zabijte proces (nahraďte PID)
kill -9 PID

# Refresh v Claude Code
/mcp
```

## 📖 Další zdroje

- [Freelo API Dokumentace](https://developers.freelo.io/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Claude Code Docs](https://docs.claude.com/)

## 🤝 Přispívání

Příspěvky jsou vítány!

1. Forkněte repozitář
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitněte změny (`git commit -m 'Add AmazingFeature'`)
4. Pushněte branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

## 📝 Changelog

### v2.0.5 (2025-10-09) - NPX instalace funguje! 🎉
- 🐛 **KRITICKÁ OPRAVA:** Odstraněn `isMainModule` check který bránil npx spuštění
- ✅ NPX instalace plně funkční: `npx -y freelo-mcp`
- ✅ Bin soubor zjednodušen (611B → 144B)
- ✅ Odstraněny všechny console.log/warn z MCP serveru (porušovaly stdio protokol)
- ✅ Automatické spuštění při načtení modulu
- ✅ Funguje jak přes npx tak přímým spuštěním
- 📝 Aktualizovaná dokumentace s `--` separátorem pro Claude Code

### v2.0.0-2.0.4 (2025-10-09)
- ✅ Kompletní testování 98 MCP tools
- ✅ Opraveno 11 bugů v API integraci
- ✅ Přidány token limit fixes (4 tools s pagination)
- ✅ FormData fix pro upload_file
- ✅ Custom fields enum validation fix
- ✅ Tasklist from template fix
- ✅ 97%+ coverage všech funkcí
- ✅ Production-ready release
- 📚 Rozšířená dokumentace pro 7 MCP klientů

### v1.0.0
- 🎉 Iniciální release
- 📦 98 MCP tools
- 🔧 REST API server
- 📚 Základní dokumentace

## 📄 Licence

Tento projekt je licencován pod [MIT licencí](LICENSE).

## 👤 Autor

**Chodeec (karlost)**

- GitHub: [@karlost](https://github.com/karlost)
- NPM: [freelo-mcp](https://www.npmjs.com/package/freelo-mcp)

## ⚠️ Disclaimer

Tento projekt není oficiálně podporován společností Freelo. Je to komunitní projekt vytvořený pro integraci Freelo s AI asistenty přes Model Context Protocol.

## 🌟 Podpora projektu

Pokud vám tento projekt pomohl, zvažte:
- ⭐ Přidání hvězdičky na GitHubu
- 🐛 Nahlášení bugů
- 💡 Návrhy na vylepšení
- 🤝 Pull requesty s novými features

---

<p align="center">Made with ❤️ for Freelo community</p>

<p align="center">
  <sub>Created and maintained with assistance from <a href="https://claude.ai">Claude Code</a> by Anthropic</sub>
</p>
