# AI Agent Guide for Freelo MCP Server

This guide helps AI agents effectively use the Freelo MCP server's 98 tools to manage projects, tasks, and workflows in Freelo.

## Table of Contents

1. [Quick Start Workflows](#quick-start-workflows)
2. [Core Concepts](#core-concepts)
3. [Common Workflows](#common-workflows)
4. [Tool Selection Guide](#tool-selection-guide)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Error Handling](#error-handling)
7. [Performance Tips](#performance-tips)
8. [Best Practices](#best-practices)

---

## Quick Start Workflows

### Create a New Task
```
1. get_projects → Get project IDs
2. get_project_tasklists → Get tasklist IDs
3. create_task → Create the task
```

### Find and Complete Tasks
```
1. get_all_tasks (with filters) → Find specific tasks
2. edit_task → Update task if needed
3. finish_task → Mark as completed
```

### Generate Project Report
```
1. get_project_details → Get project overview
2. get_all_tasks (filter by project) → Get task list
3. get_work_reports (filter by project + date) → Get time data
4. Analyze and format results
```

---

## Core Concepts

### 1. Entity Hierarchy
```
Organization
├── Projects (get_projects, get_all_projects)
│   ├── Tasklists (get_project_tasklists)
│   │   └── Tasks (get_tasklist_tasks, get_all_tasks)
│   │       └── Subtasks (get_subtasks, create_subtask)
│   ├── Notes (create_note, get_note)
│   ├── Files (get_all_files, upload_file)
│   └── Pinned Items (get_pinned_items, pin_item)
├── Users (get_users)
└── Labels (find_available_labels, create_task_labels)
```

### 2. ID Types
- **Numeric String IDs**: Projects, tasklists, tasks, users, workers (e.g., "197352")
- **UUID**: Custom fields, enum options, notes (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
- **Numeric Arrays**: Filters in get_all_tasks, get_events (e.g., [197352, 198000])

### 3. Date Formats
- **Date only**: YYYY-MM-DD (e.g., "2025-10-11")
- **Date with time**: YYYY-MM-DD HH:MM:SS (e.g., "2025-10-11 15:30:00")

### 4. Pagination
- Most list endpoints use `p` parameter starting at **0** (not 1!)
- Default page sizes vary by endpoint
- Always use pagination for large datasets to avoid token limits

---

## Common Workflows

### 1. Project Setup
```javascript
// Create project structure
1. create_project({ name: "Client Project", currency_iso: "USD" })
   → Returns: { id: "197352", ... }

2. create_tasklist({ projectId: "197352", name: "Planning" })
   → Returns: { id: "12345", ... }

3. create_task({
     projectId: "197352",
     tasklistId: "12345",
     taskData: { name: "Initial meeting", assignedTo: "67890" }
   })
```

### 2. Task Management
```javascript
// Find overdue tasks
1. get_all_tasks({
     filters: {
       state_id: 1,  // Active only
       due_date_range: {
         date_from: "2025-01-01",
         date_to: "2025-10-10"  // Yesterday
       }
     }
   })

// Update and assign
2. edit_task({
     taskId: "12345",
     taskData: {
       assignedTo: "67890",
       dueDate: "2025-10-15"
     }
   })
```

### 3. Time Tracking
```javascript
// Manual time entry
1. create_work_report({
     taskId: "12345",
     reportData: {
       minutes: 120,
       date: "2025-10-11",
       description: "Development work"
     }
   })

// Real-time tracking
1. start_time_tracking({ taskId: "12345" })
   → Work...
2. stop_time_tracking()  // Auto-creates work report
```

### 4. Search and Discovery
```javascript
// Cross-entity search
1. search_elasticsearch({
     searchData: {
       search_query: "urgent API bug",
       projects_ids: [197352],
       entity_type: "task",
       state_ids: ["active"]
     }
   })

// Label-based filtering
1. find_available_labels({ projectId: "197352" })
   → Get available labels

2. get_all_tasks({
     filters: {
       with_label: "urgent",
       projects_ids: [197352]
     }
   })
```

### 5. Reporting
```javascript
// Monthly project report
1. get_project_details({ projectId: "197352" })
   → Project info

2. get_all_tasks({
     filters: {
       projects_ids: [197352],
       finished_date_range: {
         date_from: "2025-10-01",
         date_to: "2025-10-31"
       }
     }
   })
   → Completed tasks

3. get_work_reports({
     filters: {
       projects_ids: ["197352"],
       date_reported_range: {
         date_from: "2025-10-01",
         date_to: "2025-10-31"
       }
     }
   })
   → Time data

4. Aggregate and format results
```

### 6. Custom Fields (Premium)
```javascript
// Setup custom fields
1. get_custom_field_types()
   → Available types

2. create_custom_field({
     projectId: "197352",
     fieldData: {
       name: "Priority Level",
       type: "select",
       is_required: "no"
     }
   })
   → Returns: { uuid: "a1b2c3d4-...", ... }

3. create_enum_option({
     customFieldUuid: "a1b2c3d4-...",
     optionData: { name: "High", color: "#FF0000" }
   })

// Apply to tasks
4. add_or_edit_enum_value({
     valueData: {
       task_id: "12345",
       custom_field_uuid: "a1b2c3d4-...",
       enum_option_uuid: "b2c3d4e5-..."
     }
   })
```

---

## Tool Selection Guide

### When to use which tool?

#### Finding Tasks
- **get_all_tasks**: Cross-project search with 14 filters (primary tool)
- **get_tasklist_tasks**: Simple list from known tasklist
- **get_finished_tasks**: Only completed tasks in tasklist
- **search_elasticsearch**: Full-text search across all entities

#### Project Information
- **get_projects**: Your own projects only (fast)
- **get_all_projects**: All accessible projects (comprehensive)
- **get_project_details**: Deep dive into specific project

#### Time Tracking
- **create_work_report**: Manual time entry after work
- **start_time_tracking + stop_time_tracking**: Real-time tracking during work
- **get_work_reports**: Retrieve time entries for reporting

#### Task Operations
- **create_task**: Create from scratch
- **create_task_from_template**: Use existing template
- **edit_task**: Update existing task
- **finish_task / activate_task**: Change state

#### File Handling
- **upload_file**: Small files (<5MB), simple base64 encoding
- **upload_file (FormData)**: Large files, multipart upload

---

## Data Flow Patterns

### Pattern 1: Top-Down Discovery
```
get_projects
  ↓
get_project_details
  ↓
get_project_tasklists
  ↓
get_tasklist_tasks
  ↓
get_task_details
```

### Pattern 2: Search-Based Discovery
```
search_elasticsearch / get_all_tasks
  ↓
get_task_details (if needed)
  ↓
edit_task / finish_task
```

### Pattern 3: Time Tracking Flow
```
get_all_tasks (find task)
  ↓
start_time_tracking
  ↓
[User works...]
  ↓
stop_time_tracking (auto-creates work report)
```

### Pattern 4: Reporting Flow
```
get_projects
  ↓
[get_all_tasks, get_work_reports, get_events] (parallel)
  ↓
Aggregate and analyze
  ↓
Format report
```

---

## Error Handling

### Common Errors

1. **404 Not Found**
   - Cause: Invalid ID or insufficient permissions
   - Solution: Verify ID from parent lookup (e.g., get_projects before get_project_details)

2. **400 Bad Request**
   - Cause: Invalid parameters or missing required fields
   - Solution: Check parameter types (string vs number vs array)

3. **403 Forbidden**
   - Cause: Insufficient permissions or premium-only feature
   - Solution: Check user role or Freelo plan

4. **401 Unauthorized**
   - Cause: Invalid API credentials
   - Solution: Verify FREELO_EMAIL and FREELO_API_KEY in .env

### Validation Tips
- Always get parent IDs first (project → tasklist → task)
- Use numeric strings for IDs: "197352" not 197352
- Use arrays for multi-value filters: [197352] not "197352"
- Check date format: "YYYY-MM-DD" not "DD/MM/YYYY"

---

## Performance Tips

### 1. Use Specific Queries
❌ Bad: `get_all_tasks({})` → Returns everything
✅ Good: `get_all_tasks({ filters: { projects_ids: [197352], state_id: 1 } })`

### 2. Paginate Large Results
```javascript
// For large datasets
get_all_tasks({ filters: { p: 0 } })  // First page
get_all_tasks({ filters: { p: 1 } })  // Second page
```

### 3. Batch Operations
When safe, make parallel calls:
```javascript
// Parallel (independent operations)
Promise.all([
  get_projects(),
  get_users(),
  find_available_labels()
])

// Sequential (dependent operations)
const project = await get_projects()
const tasklists = await get_project_tasklists(project.id)
```

### 4. Cache Reference Data
Cache these for duration of workflow:
- Project IDs and names
- User IDs and names
- Label names
- State IDs

---

## Best Practices

### 1. Always Verify Before Action
```javascript
// ❌ Don't assume
delete_project({ projectId: "197352" })

// ✅ Verify first
const project = await get_project_details({ projectId: "197352" })
if (project.name === "Test Project") {
  await delete_project({ projectId: "197352" })
}
```

### 2. Use Descriptive Names
```javascript
// ❌ Generic
create_task({ taskData: { name: "Task" } })

// ✅ Descriptive
create_task({
  taskData: {
    name: "Fix login API authentication bug",
    description: "Users report 401 errors on /api/auth/login"
  }
})
```

### 3. Prefer Edit Over Delete
```javascript
// ❌ Destructive
delete_task({ taskId: "12345" })

// ✅ Reversible
finish_task({ taskId: "12345" })
// Can activate_task later if needed
```

### 4. Use Labels for Organization
```javascript
// Create consistent label structure
create_task_labels({ labelData: { name: "urgent", color: "#FF0000" } })
create_task_labels({ labelData: { name: "bug", color: "#DC3545" } })
create_task_labels({ labelData: { name: "feature", color: "#28A745" } })

// Then filter easily
get_all_tasks({ filters: { with_label: "urgent" } })
```

### 5. Track Time Consistently
```javascript
// For billing/reporting, always include descriptions
create_work_report({
  taskId: "12345",
  reportData: {
    minutes: 90,
    date: "2025-10-11",
    description: "Implemented user authentication" // Important!
  }
})
```

### 6. Document with Notes
```javascript
// Use notes for project documentation
create_note({
  projectId: "197352",
  noteData: {
    name: "API Documentation",
    content: "# API Endpoints\n\n## Authentication\n..."
  }
})

// Pin important notes
pin_item({
  projectId: "197352",
  itemData: { type: "note", item_id: "noteId" }
})
```

### 7. Search Smart
```javascript
// For known structure
get_all_tasks({ filters: { projects_ids: [197352] } })

// For unknown location or fuzzy search
search_elasticsearch({
  searchData: {
    search_query: "authentication",
    entity_type: "task"
  }
})
```

### 8. Handle Pagination
```javascript
// Template for paginated queries
async function getAllTasks(projectId) {
  const allTasks = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const response = await get_all_tasks({
      filters: { projects_ids: [projectId], p: page }
    })
    allTasks.push(...response.tasks)
    hasMore = response.tasks.length > 0
    page++
  }

  return allTasks
}
```

---

## Tool Categories Reference

### Projects (18 tools)
- **List**: get_projects, get_all_projects, get_invited_projects, get_archived_projects, get_template_projects, get_user_projects
- **Manage**: create_project, create_project_from_template, archive_project, activate_project, delete_project
- **Details**: get_project_details, get_project_manager_of
- **Workers**: get_project_workers, remove_workers, remove_workers_by_emails, invite_users_by_email, invite_users_by_ids

### Tasks (21 tools)
- **List**: get_all_tasks, get_tasklist_tasks, get_finished_tasks
- **Manage**: create_task, create_task_from_template, edit_task, delete_task, move_task
- **State**: finish_task, activate_task
- **Details**: get_task_details, get_task_description, update_task_description
- **Sharing**: get_public_link, delete_public_link
- **Reminders**: create_task_reminder, delete_task_reminder
- **Time Estimates** (Premium): set_total_time_estimate, delete_total_time_estimate, set_user_time_estimate, delete_user_time_estimate

### Tasklists (5 tools)
- get_project_tasklists, get_tasklist_details, create_tasklist, create_tasklist_from_template, get_assignable_workers

### Subtasks (2 tools)
- create_subtask, get_subtasks

### Files (3 tools)
- get_all_files, upload_file, download_file

### Users (6 tools)
- get_users, get_project_workers, remove_workers, get_out_of_office, set_out_of_office, delete_out_of_office

### Time Tracking (7 tools)
- **Work Reports**: get_work_reports, create_work_report, update_work_report, delete_work_report
- **Live Tracking**: start_time_tracking, stop_time_tracking, edit_time_tracking

### Custom Fields (11 tools) - Premium Feature
- **Fields**: get_custom_field_types, create_custom_field, rename_custom_field, delete_custom_field, restore_custom_field, get_custom_fields_by_project
- **Values**: add_or_edit_field_value, delete_field_value
- **Enum Options**: add_or_edit_enum_value, get_enum_options, create_enum_option

### Labels (3 tools)
- find_available_labels, create_task_labels, (remove via edit_task)

### States (1 tool)
- get_all_states

### Events (1 tool)
- get_events

### Notes (4 tools)
- create_note, get_note, update_note, delete_note

### Notifications (3 tools)
- get_all_notifications, mark_notification_read, mark_notification_unread

### Pinned Items (3 tools)
- get_pinned_items, pin_item, delete_pinned_item

### Filters (3 tools)
- get_custom_filters, get_tasks_by_filter_uuid, get_tasks_by_filter_name

### Invoicing (4 tools)
- get_issued_invoices, get_invoice_detail, download_invoice_reports, mark_as_invoiced

### Comments (1 tool)
- get_all_comments

### Search (1 tool)
- search_elasticsearch

---

## Frequently Asked Questions

### Q: What's the difference between get_projects and get_all_projects?
**A:** `get_projects` returns only projects you own (faster), while `get_all_projects` returns all accessible projects including shared ones (comprehensive).

### Q: How do I find a task when I don't know which project it's in?
**A:** Use `search_elasticsearch` with the task name or `get_all_tasks` with `search_query` filter.

### Q: Can I create subtasks under subtasks?
**A:** No, Freelo supports only one level of subtasks under main tasks.

### Q: What's the pagination parameter - p or page?
**A:** Most endpoints use `p` (starts at 0). Only `get_all_notifications` uses `page` (starts at 1).

### Q: How do I handle large file uploads?
**A:** Files <5MB: use base64 encoding. Files >5MB: use FormData with multipart upload (see upload_file tool).

### Q: What happens when I finish_task?
**A:** Task state changes to "finished" (state_id: 2), task moves to completed section, and completion timestamp is recorded.

### Q: Can I recover a deleted task?
**A:** No, `delete_task` is permanent. Use `finish_task` instead for reversible completion.

### Q: How do custom fields work?
**A:** Custom fields are a premium feature that extends tasks with additional metadata. Create field → Create options (for select fields) → Apply to tasks.

### Q: What's the difference between work reports and time tracking?
**A:** Work reports are manual time entries after work. Time tracking (start/stop) runs a live timer during work and auto-creates a work report when stopped.

---

## Additional Resources

- **Freelo API Documentation**: https://api.freelo.io/v1/docs
- **MCP Server Repository**: https://github.com/yourusername/freelo-mcp
- **Issue Tracker**: https://github.com/yourusername/freelo-mcp/issues

---

**Last Updated**: 2025-10-11
**Server Version**: 2.1.0
**Total Tools**: 98
