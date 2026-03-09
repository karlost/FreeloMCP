/**
 * Comprehensive real API integration test for ALL Freelo MCP tools
 * Tests all 104+ tools against the live Freelo API.
 *
 * Usage:
 *   FREELO_EMAIL=... FREELO_API_KEY=... FREELO_USER_AGENT=freelo-mcp node tests/real-api-full-test.js
 */

import { getApiClient } from '../utils/authHelper.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';

const api = getApiClient();
const PROJECT_ID = '197352'; // WoW Transmog Auction
let passed = 0, failed = 0, skipped = 0;
const failures = [];
const skippedTests = [];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test(name, fn, retries = 1) {
  await delay(1500);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fn();
      passed++;
      console.log('\x1b[32m✓\x1b[0m', name);
      return r;
    } catch (e) {
      // Retry on 429
      if (e.response && e.response.status === 429 && attempt < retries) {
        console.log('\x1b[33m⟳\x1b[0m', name, '- 429, retrying after 3s...');
        await delay(3000);
        continue;
      }
      // 402 = plan limitation, skip instead of fail
      if (e.response && e.response.status === 402) {
        skip(name, 'Plan limitation (402 Payment Required)');
        return null;
      }
      failed++;
      const msg = e.response
        ? `${e.response.status} ${JSON.stringify(e.response.data).substring(0, 150)}`
        : e.message;
      console.log('\x1b[31m✗\x1b[0m', name, '-', msg);
      failures.push({ name, msg });
      return null;
    }
  }
}

function skip(name, reason) {
  skipped++;
  console.log('\x1b[33m⊘\x1b[0m', name, '-', reason);
  skippedTests.push({ name, reason });
}

// ============================================================
// SECTION 1: READ-ONLY TESTS
// ============================================================

console.log('==================================================');
console.log('SECTION 1: READ-ONLY TESTS');
console.log('==================================================\n');

// --- Projects (7 read tools) ---
console.log('--- Projects ---');

await test('get_projects', async () => {
  const r = await api.get('/projects');
  if (!Array.isArray(r.data) || !r.data.length) throw new Error('Expected non-empty array');
  return r.data;
});

await test('get_all_projects', async () => {
  const r = await api.get('/all-projects');
  const items = unwrapPaginatedResponse(r.data);
  if (!Array.isArray(items) || !items.length) throw new Error('Expected non-empty array');
  return items;
});

await test('get_project_details', async () => {
  const r = await api.get(`/project/${PROJECT_ID}`);
  if (!r.data.id) throw new Error('No id in response');
  return r.data;
});

await test('get_invited_projects', async () => {
  const r = await api.get('/invited-projects');
  unwrapPaginatedResponse(r.data); // just verify no crash
});

await test('get_archived_projects', async () => {
  const r = await api.get('/archived-projects');
  unwrapPaginatedResponse(r.data);
});

const templateProjects = await test('get_template_projects', async () => {
  const r = await api.get('/template-projects');
  return unwrapPaginatedResponse(r.data);
});

// --- Users (4 read tools) ---
console.log('\n--- Users ---');

const users = await test('get_users', async () => {
  const r = await api.get('/users');
  const items = unwrapPaginatedResponse(r.data);
  if (!Array.isArray(items) || !items.length) throw new Error('Expected non-empty users array');
  return items;
});

const firstUserId = users ? (users[0].id || users[0].uuid) : null;

if (firstUserId) {
  await test('get_user_projects', async () => {
    const r = await api.get(`/user/${firstUserId}/all-projects`);
    unwrapPaginatedResponse(r.data);
  });
} else {
  skip('get_user_projects', 'No user ID available');
}

await test('get_project_workers', async () => {
  const r = await api.get(`/project/${PROJECT_ID}/workers`);
  const items = unwrapPaginatedResponse(r.data);
  return items;
});

// get_out_of_office - domain verification often fails, treat as expected
if (firstUserId) {
  try {
    await delay(1200);
    const r = await api.get(`/user/${firstUserId}/out-of-office`);
    passed++;
    console.log('\x1b[32m✓\x1b[0m', 'get_out_of_office');
  } catch (e) {
    if (e.response && e.response.status === 400 && JSON.stringify(e.response.data).includes('not verified')) {
      skip('get_out_of_office', "Domain not verified (known Freelo limitation)");
    } else {
      failed++;
      const msg = e.response ? `${e.response.status} ${JSON.stringify(e.response.data).substring(0, 150)}` : e.message;
      console.log('\x1b[31m✗\x1b[0m', 'get_out_of_office', '-', msg);
      failures.push({ name: 'get_out_of_office', msg });
    }
  }
} else {
  skip('get_out_of_office', 'No user ID available');
}

await test('get_project_manager_of', async () => {
  const r = await api.get('/users/project-manager-of');
  return r.data;
});

// --- Tasklists (3 read tools) ---
console.log('\n--- Tasklists ---');

const tasklists = await test('get_project_tasklists', async () => {
  const r = await api.get('/all-tasklists', { params: { projects_ids: [PROJECT_ID] } });
  const items = unwrapPaginatedResponse(r.data);
  if (!Array.isArray(items) || !items.length) throw new Error('Expected non-empty tasklists');
  return items;
});

const firstTasklistId = tasklists ? String(tasklists[0].id) : null;

if (firstTasklistId) {
  await test('get_tasklist_details', async () => {
    const r = await api.get(`/tasklist/${firstTasklistId}`);
    if (!r.data.id) throw new Error('No id in response');
    return r.data;
  });

  await test('get_assignable_workers', async () => {
    const r = await api.get(`/project/${PROJECT_ID}/tasklist/${firstTasklistId}/assignable-workers`);
    return r.data;
  });
} else {
  skip('get_tasklist_details', 'No tasklist ID available');
  skip('get_assignable_workers', 'No tasklist ID available');
}

// --- Tasks (5 read tools) ---
console.log('\n--- Tasks ---');

const allTasks = await test('get_all_tasks', async () => {
  const r = await api.get('/all-tasks', { params: { projects_ids: [parseInt(PROJECT_ID)] } });
  let tasks = r.data;
  if (tasks && tasks.data && tasks.data.tasks) tasks = tasks.data.tasks;
  return tasks;
});

let firstTaskId = null;
if (Array.isArray(allTasks) && allTasks.length > 0) {
  firstTaskId = String(allTasks[0].id);
}

if (firstTasklistId) {
  await test('get_tasklist_tasks', async () => {
    const r = await api.get(`/project/${PROJECT_ID}/tasklist/${firstTasklistId}/tasks`, {
      params: { order_by: 'priority', order: 'asc' }
    });
    return r.data;
  });
} else {
  skip('get_tasklist_tasks', 'No tasklist ID available');
}

if (firstTaskId) {
  await test('get_task_details', async () => {
    const r = await api.get(`/task/${firstTaskId}`);
    if (!r.data.id) throw new Error('No id in response');
    return r.data;
  });

  // get_task_description returns 404 if task has no description - that's valid behavior
  try {
    await delay(1200);
    const r = await api.get(`/task/${firstTaskId}/description`);
    passed++;
    console.log('\x1b[32m✓\x1b[0m', 'get_task_description');
  } catch (e) {
    if (e.response && e.response.status === 404) {
      passed++;
      console.log('\x1b[32m✓\x1b[0m', 'get_task_description (404 = no description set, valid)');
    } else {
      failed++;
      const msg = e.response ? `${e.response.status} ${JSON.stringify(e.response.data).substring(0, 150)}` : e.message;
      console.log('\x1b[31m✗\x1b[0m', 'get_task_description', '-', msg);
      failures.push({ name: 'get_task_description', msg });
    }
  }
} else {
  skip('get_task_details', 'No task ID available');
  skip('get_task_description', 'No task ID available');
}

if (firstTasklistId) {
  await test('get_finished_tasks', async () => {
    const r = await api.get(`/tasklist/${firstTasklistId}/finished-tasks`);
    return r.data;
  });
} else {
  skip('get_finished_tasks', 'No tasklist ID available');
}

// --- Other read tools (17 tools) ---
console.log('\n--- Comments, Files, Labels, etc. ---');

await test('get_all_comments', async () => {
  const r = await api.get('/all-comments', { params: { projects_ids: [parseInt(PROJECT_ID)] } });
  unwrapPaginatedResponse(r.data);
});

const allFiles = await test('get_all_files', async () => {
  const r = await api.get('/all-docs-and-files', { params: { projects_ids: [parseInt(PROJECT_ID)] } });
  return unwrapPaginatedResponse(r.data);
});

if (firstTaskId) {
  await test('get_subtasks', async () => {
    const r = await api.get(`/task/${firstTaskId}/subtasks`);
    return r.data;
  });

  await test('get_public_link', async () => {
    const r = await api.get(`/public-link/task/${firstTaskId}`);
    return r.data;
  });
} else {
  skip('get_subtasks', 'No task ID available');
  skip('get_public_link', 'No task ID available');
}

await test('find_available_labels', async () => {
  const r = await api.get('/project-labels/find-available', { params: { project_id: PROJECT_ID } });
  return r.data;
});

await test('get_all_states', async () => {
  const r = await api.get('/states');
  const items = unwrapPaginatedResponse(r.data);
  if (!Array.isArray(items) || !items.length) throw new Error('Expected non-empty states');
  return items;
});

const notifications = await test('get_all_notifications', async () => {
  const r = await api.get('/all-notifications');
  return unwrapPaginatedResponse(r.data);
});

await test('search_elasticsearch', async () => {
  const r = await api.post('/search', { search_query: 'transmog' });
  return r.data;
});

const customFilters = await test('get_custom_filters', async () => {
  const r = await api.get('/dashboard/custom-filters');
  return r.data;
});

await test('get_events', async () => {
  const r = await api.get('/events', { params: { projects_ids: [parseInt(PROJECT_ID)] } });
  return r.data;
});

await test('get_pinned_items', async () => {
  const r = await api.get(`/project/${PROJECT_ID}/pinned-items`);
  return r.data;
});

await test('get_work_reports', async () => {
  const r = await api.get('/work-reports', { params: { projects_ids: [parseInt(PROJECT_ID)] } });
  unwrapPaginatedResponse(r.data);
});

const invoices = await test('get_issued_invoices', async () => {
  const r = await api.get('/issued-invoices');
  return unwrapPaginatedResponse(r.data);
});

const customFieldTypes = await test('get_custom_field_types', async () => {
  const r = await api.get('/custom-field/get-types');
  return unwrapPaginatedResponse(r.data);
});

const customFieldsByProject = await test('get_custom_fields_by_project', async () => {
  const r = await api.get(`/custom-field/find-by-project/${PROJECT_ID}`);
  return r.data;
});

// --- download_file (only if actual file UUID found, not documents/links) ---
let fileUuid = null;
if (Array.isArray(allFiles) && allFiles.length > 0) {
  // Only actual files can be downloaded, not documents/links/directories
  for (const f of allFiles) {
    if (f.type === 'file' && f.uuid) { fileUuid = f.uuid; break; }
  }
}

if (fileUuid) {
  await test('download_file', async () => {
    const r = await api.get(`/file/${fileUuid}`, { responseType: 'arraybuffer' });
    if (!r.data) throw new Error('No file data returned');
  });
} else {
  skip('download_file', 'No file UUID found in project files');
}

// --- Filter tools (2 read tools) ---
console.log('\n--- Custom Filters ---');

let filtersList = Array.isArray(customFilters) ? customFilters : [];
if (!Array.isArray(filtersList) && customFilters && typeof customFilters === 'object') {
  // Try to unwrap
  const keys = Object.keys(customFilters);
  for (const key of keys) {
    if (Array.isArray(customFilters[key])) {
      filtersList = customFilters[key];
      break;
    }
  }
}

if (filtersList.length > 0 && filtersList[0].uuid) {
  await test('get_tasks_by_filter_uuid', async () => {
    const r = await api.get(`/dashboard/custom-filter/by-uuid/${filtersList[0].uuid}/tasks`);
    return r.data;
  });
} else {
  skip('get_tasks_by_filter_uuid', 'No custom filters found');
}

if (filtersList.length > 0 && filtersList[0].name) {
  await test('get_tasks_by_filter_name', async () => {
    const r = await api.get(`/dashboard/custom-filter/by-name/${encodeURIComponent(filtersList[0].name)}/tasks`);
    return r.data;
  });
} else {
  skip('get_tasks_by_filter_name', 'No custom filters found');
}

// --- Invoice detail tools (3 read tools) ---
console.log('\n--- Invoices ---');

let invoiceId = null;
if (Array.isArray(invoices) && invoices.length > 0) {
  invoiceId = String(invoices[0].id);
}

if (invoiceId) {
  await test('get_invoice_detail', async () => {
    const r = await api.get(`/issued-invoice/${invoiceId}`);
    return r.data;
  });

  await test('download_invoice_reports', async () => {
    const r = await api.get(`/issued-invoice/${invoiceId}/reports`);
    return r.data;
  });

  await test('get_invoice_reports_json', async () => {
    const r = await api.get(`/issued-invoice/${invoiceId}/reports-json`);
    return r.data;
  });
} else {
  skip('get_invoice_detail', 'No invoices found');
  skip('download_invoice_reports', 'No invoices found');
  skip('get_invoice_reports_json', 'No invoices found');
}

// --- Enum options (1 read tool) ---
console.log('\n--- Enum Options ---');

let enumCustomFieldUuid = null;
if (Array.isArray(customFieldsByProject)) {
  for (const cf of customFieldsByProject) {
    if (cf.type === 'enum' && cf.uuid) {
      enumCustomFieldUuid = cf.uuid;
      break;
    }
  }
}

if (enumCustomFieldUuid) {
  await test('get_enum_options', async () => {
    const r = await api.get(`/custom-field-enum/get-for-custom-field/${enumCustomFieldUuid}`);
    return r.data;
  });
} else {
  skip('get_enum_options', 'No enum custom fields found in project');
}


// ============================================================
// SECTION 2: WRITE TESTS
// ============================================================

console.log('\n==================================================');
console.log('SECTION 2: WRITE TESTS (create -> modify -> cleanup)');
console.log('==================================================\n');


// --- Group A: Project CRUD (4 tools) ---
console.log('--- Group A: Project CRUD ---');

const newProject = await test('create_project', async () => {
  const r = await api.post('/projects', {
    name: 'MCP Test Project (auto-delete)',
    currency_iso: 'CZK'
  });
  if (!r.data.id) throw new Error('No project id');
  return r.data;
});

const newProjectId = newProject ? String(newProject.id) : null;

if (newProjectId) {
  await test('archive_project', async () => {
    const r = await api.post(`/project/${newProjectId}/archive`);
    return r.data;
  });

  await test('activate_project', async () => {
    const r = await api.post(`/project/${newProjectId}/activate`);
    return r.data;
  });

  await test('delete_project', async () => {
    const r = await api.delete(`/project/${newProjectId}`);
    return r.data;
  });
} else {
  skip('archive_project', 'create_project failed');
  skip('activate_project', 'create_project failed');
  skip('delete_project', 'create_project failed');
}


// --- Group B: Tasklist CRUD (1 tool + template) ---
console.log('\n--- Group B: Tasklist CRUD ---');

const newTasklist = await test('create_tasklist', async () => {
  const r = await api.post(`/project/${PROJECT_ID}/tasklists`, {
    name: 'MCP Test Tasklist (auto-delete)'
  });
  if (!r.data.id) throw new Error('No tasklist id');
  return r.data;
});

const testTasklistId = newTasklist ? String(newTasklist.id) : firstTasklistId;


// --- Group C: Task CRUD + related (18 tools) ---
console.log('\n--- Group C: Task CRUD + related ---');

const testTask = await test('create_task', async () => {
  const tlId = testTasklistId || firstTasklistId;
  if (!tlId) throw new Error('No tasklist ID available');
  const r = await api.post(`/project/${PROJECT_ID}/tasklist/${tlId}/tasks`, {
    name: 'MCP Full Test Task (auto-delete)'
  });
  if (!r.data.id) throw new Error('No task id');
  return r.data;
});

const testTaskId = testTask ? String(testTask.id) : null;

if (testTaskId) {
  await test('edit_task', async () => {
    const r = await api.post(`/task/${testTaskId}`, {
      name: 'MCP Test - Edited'
    });
    return r.data;
  });

  await test('update_task_description', async () => {
    const r = await api.post(`/task/${testTaskId}/description`, {
      content: 'Test description from MCP integration test'
    });
    return r.data;
  });

  await test('get_task_description (after setting)', async () => {
    const r = await api.get(`/task/${testTaskId}/description`);
    return r.data;
  });

  // Create comment and capture response
  const testComment = await test('create_comment', async () => {
    const r = await api.post(`/task/${testTaskId}/comments`, {
      content: 'Test comment from MCP integration test'
    });
    return r.data;
  });

  const testCommentId = testComment ? String(testComment.id) : null;

  if (testCommentId) {
    await test('edit_comment', async () => {
      const r = await api.post(`/comment/${testCommentId}`, {
        content: 'Edited comment from MCP integration test'
      });
      return r.data;
    });
  } else {
    skip('edit_comment', 'create_comment failed');
  }

  await test('create_subtask', async () => {
    const r = await api.post(`/task/${testTaskId}/subtasks`, {
      name: 'Test subtask from MCP'
    });
    return r.data;
  });

  await test('get_subtasks (write task)', async () => {
    const r = await api.get(`/task/${testTaskId}/subtasks`);
    return r.data;
  });

  const tlForMove = testTasklistId || firstTasklistId;
  if (tlForMove) {
    await test('move_task', async () => {
      const r = await api.post(`/task/${testTaskId}/move/${tlForMove}`);
      return r.data;
    });
  } else {
    skip('move_task', 'No tasklist ID for move');
  }

  // Time estimates (premium features - may return 402/404 on free plans)
  const totalEstimateResult = await test('set_total_time_estimate', async () => {
    const r = await api.post(`/task/${testTaskId}/total-time-estimate`, { minutes: 120 });
    return r.data;
  });

  if (totalEstimateResult) {
    await test('delete_total_time_estimate', async () => {
      const r = await api.delete(`/task/${testTaskId}/total-time-estimate`);
      return r.data;
    });
  } else {
    skip('delete_total_time_estimate', 'set_total_time_estimate failed (plan limitation)');
  }

  if (firstUserId && totalEstimateResult) {
    await test('set_user_time_estimate', async () => {
      const r = await api.post(`/task/${testTaskId}/users-time-estimates/${firstUserId}`, { minutes: 60 });
      return r.data;
    });

    await test('delete_user_time_estimate', async () => {
      const r = await api.delete(`/task/${testTaskId}/users-time-estimates/${firstUserId}`);
      return r.data;
    });
  } else {
    skip('set_user_time_estimate', firstUserId ? 'Premium feature not available' : 'No user ID available');
    skip('delete_user_time_estimate', firstUserId ? 'Premium feature not available' : 'No user ID available');
  }

  // Task reminder
  await test('create_task_reminder', async () => {
    const r = await api.post(`/task/${testTaskId}/reminder`, {
      remind_at: '2026-12-31T10:00:00+01:00'
    });
    return r.data;
  });

  await test('delete_task_reminder', async () => {
    const r = await api.delete(`/task/${testTaskId}/reminder`);
    return r.data;
  });

  // Public link
  await test('get_public_link (write task)', async () => {
    const r = await api.get(`/public-link/task/${testTaskId}`);
    return r.data;
  });

  await test('delete_public_link', async () => {
    const r = await api.delete(`/public-link/task/${testTaskId}`);
    return r.data;
  });

  // --- Group F: Pinned Items (2 tools) - using the test task ---
  console.log('\n--- Group F: Pinned Items ---');

  const pinnedItem = await test('pin_item', async () => {
    const r = await api.post(`/project/${PROJECT_ID}/pinned-items`, {
      type: 'task',
      item_id: testTaskId,
      link: '#'
    });
    return r.data;
  });

  // Try to find pinned item ID
  let pinnedItemId = null;
  if (pinnedItem && pinnedItem.id) {
    pinnedItemId = String(pinnedItem.id);
  } else {
    // Fetch pinned items to find the one we just created
    await delay(500);
    try {
      const pinned = await api.get(`/project/${PROJECT_ID}/pinned-items`);
      const pinnedItems = Array.isArray(pinned.data) ? pinned.data : [];
      if (pinnedItems.length > 0) {
        pinnedItemId = String(pinnedItems[pinnedItems.length - 1].id);
      }
    } catch (_) { /* ignore */ }
  }

  if (pinnedItemId) {
    await test('delete_pinned_item', async () => {
      const r = await api.delete(`/pinned-item/${pinnedItemId}`);
      return r.data;
    });
  } else {
    skip('delete_pinned_item', 'Could not determine pinned item ID');
  }

  // --- Group G: Work Reports (3 write tools) ---
  console.log('\n--- Group G: Work Reports ---');

  const workReport = await test('create_work_report', async () => {
    const r = await api.post(`/task/${testTaskId}/work-reports`, {
      minutes: 30,
      date: '2026-03-09',
      description: 'MCP test work report'
    });
    return r.data;
  });

  const workReportId = workReport ? String(workReport.id) : null;

  if (workReportId) {
    await test('update_work_report', async () => {
      const r = await api.post(`/work-reports/${workReportId}`, {
        minutes: 45,
        description: 'Updated MCP test work report'
      });
      return r.data;
    });

    await test('delete_work_report', async () => {
      const r = await api.delete(`/work-reports/${workReportId}`);
      return r.data;
    });
  } else {
    skip('update_work_report', 'create_work_report failed');
    skip('delete_work_report', 'create_work_report failed');
  }

  // --- Group H: Time Tracking (3 tools) ---
  console.log('\n--- Group H: Time Tracking ---');

  await test('start_time_tracking', async () => {
    const r = await api.post('/timetracking/start', {
      task_id: parseInt(testTaskId, 10)
    });
    return r.data;
  });

  await test('edit_time_tracking', async () => {
    const r = await api.post('/timetracking/edit', {
      description: 'Testing time tracking via MCP'
    });
    return r.data;
  });

  await test('stop_time_tracking', async () => {
    const r = await api.post('/timetracking/stop');
    return r.data;
  });

  // --- Group D: Labels (7 tools) - must be done before task deletion ---
  console.log('\n--- Group D: Labels ---');

  const createdLabel = await test('create_task_labels', async () => {
    const r = await api.post('/task-labels', {
      labels: [{ name: 'MCP Test Label', color: '#e9483a' }]
    });
    return r.data;
  });

  const addedProjectLabel = await test('add_label_to_project', async () => {
    const r = await api.post(`/project-labels/add-to-project/${PROJECT_ID}`, {
      name: 'MCP Test Label 2',
      color: '#367fee',
      is_private: false
    });
    return r.data;
  });

  // Re-check available labels to see our new labels and get their IDs
  const labelsAfterCreateRaw = await test('find_available_labels (after create)', async () => {
    const r = await api.get('/project-labels/find-available', { params: { project_id: PROJECT_ID } });
    return r.data;
  });

  // Unwrap { labels: [...] } format
  let labelsAfterCreate = labelsAfterCreateRaw;
  if (labelsAfterCreate && !Array.isArray(labelsAfterCreate) && labelsAfterCreate.labels) {
    labelsAfterCreate = labelsAfterCreate.labels;
  }

  // Find label IDs from available labels (API uses numeric id, not uuid)
  let labelId = null;
  let projectLabelId = null;
  if (Array.isArray(labelsAfterCreate)) {
    for (const lbl of labelsAfterCreate) {
      if (lbl.name === 'MCP Test Label' && !labelId) labelId = lbl.id;
      if (lbl.name === 'MCP Test Label 2' && !projectLabelId) projectLabelId = lbl.id;
    }
  }
  console.log('  Labels found - labelId:', labelId, 'projectLabelId:', projectLabelId);

  // Use whichever label ID we have for add/remove from task
  const taskLabelId = projectLabelId || labelId;
  if (taskLabelId) {
    await test('add_labels_to_task', async () => {
      const r = await api.post(`/task-labels/add-to-task/${testTaskId}`, {
        labels: [{ id: taskLabelId }]
      });
      return r.data;
    });

    await test('remove_labels_from_task', async () => {
      const r = await api.post(`/task-labels/remove-from-task/${testTaskId}`, {
        labels: [{ id: taskLabelId }]
      });
      return r.data;
    });
  } else {
    skip('add_labels_to_task', 'No label ID found');
    skip('remove_labels_from_task', 'No label ID found');
  }

  if (projectLabelId || labelId) {
    const editLabelId = projectLabelId || labelId;
    await test('edit_label', async () => {
      const r = await api.post(`/project-labels/${editLabelId}`, {
        name: 'MCP Test Label Edited',
        color: '#15acc0',
        is_private: false
      });
      return r.data;
    });
  } else {
    skip('edit_label', 'No label ID found');
  }

  if (projectLabelId) {
    await test('remove_label_from_project', async () => {
      const r = await api.post(`/project-labels/remove-from-project/${PROJECT_ID}`, {
        id: parseInt(String(projectLabelId), 10)
      });
      return r.data;
    });
  } else {
    skip('remove_label_from_project', 'No project label ID found');
  }

  // Delete labels for cleanup
  if (projectLabelId) {
    await test('delete_label (project label)', async () => {
      const r = await api.delete(`/project-labels/${projectLabelId}`);
      return r.data;
    });
  } else {
    skip('delete_label (project label)', 'No project label ID found');
  }

  if (labelId && labelId !== projectLabelId) {
    await test('delete_label (task label)', async () => {
      const r = await api.delete(`/project-labels/${labelId}`);
      return r.data;
    });
  }

  // --- Group J: Custom Fields (10 write tools) - must be done before task deletion ---
  console.log('\n--- Group J: Custom Fields (text) ---');

  // Find text type UUID from custom field types
  let textTypeUuid = null;
  let enumTypeUuid = null;
  if (Array.isArray(customFieldTypes)) {
    for (const t of customFieldTypes) {
      const name = (t.name || t.type || '').toLowerCase();
      if (name === 'text' || name === 'krátký text' || name.includes('text')) textTypeUuid = t.uuid || t.id;
      if (name === 'enum' || name === 'výběr' || name.includes('enum') || name.includes('select') || name.includes('výběr')) enumTypeUuid = t.uuid || t.id;
    }
    // Fallback: use first type if text not found
    if (!textTypeUuid && customFieldTypes.length > 0) textTypeUuid = customFieldTypes[0].uuid || customFieldTypes[0].id;
    if (!enumTypeUuid && customFieldTypes.length > 1) enumTypeUuid = customFieldTypes[1].uuid || customFieldTypes[1].id;
    console.log('  Custom field types found:', customFieldTypes.map(t => `${t.name||t.type}=${t.uuid||t.id}`).join(', '));
  }

  const customField = textTypeUuid ? await test('create_custom_field', async () => {
    const r = await api.post(`/custom-field/create/${PROJECT_ID}`, {
      name: 'MCP Test Field',
      type: textTypeUuid
    });
    return r.data;
  }) : (skip('create_custom_field', 'No text type UUID available'), null);

  let cfUuid = null;
  if (customField) {
    cfUuid = customField.uuid || customField.custom_field?.uuid || null;
  }

  if (cfUuid) {
    await test('rename_custom_field', async () => {
      const r = await api.post(`/custom-field/rename/${cfUuid}`, {
        name: 'MCP Test Field Renamed'
      });
      return r.data;
    });

    const fieldValue = await test('add_or_edit_field_value', async () => {
      const r = await api.post('/custom-field/add-or-edit-value', {
        task_id: testTaskId,
        custom_field_uuid: cfUuid,
        value: 'test value from MCP'
      });
      return r.data;
    });

    // Try to get the value UUID for deletion
    let fieldValueUuid = null;
    if (fieldValue) {
      fieldValueUuid = fieldValue.uuid || fieldValue.custom_field_value?.uuid || null;
    }

    // If we don't have the value UUID from the response, try getting task details
    if (!fieldValueUuid) {
      try {
        await delay(500);
        const taskDetails = await api.get(`/task/${testTaskId}`);
        const cfValues = taskDetails.data?.custom_field_values || taskDetails.data?.custom_fields || [];
        if (Array.isArray(cfValues)) {
          for (const v of cfValues) {
            if (v.custom_field_uuid === cfUuid || v.uuid) {
              fieldValueUuid = v.uuid || v.value_uuid;
              break;
            }
          }
        }
      } catch (_) { /* ignore */ }
    }

    if (fieldValueUuid) {
      await test('delete_field_value', async () => {
        const r = await api.delete(`/custom-field/delete-value/${fieldValueUuid}`);
        return r.data;
      });
    } else {
      skip('delete_field_value', 'Could not determine field value UUID');
    }

    await test('delete_custom_field', async () => {
      const r = await api.delete(`/custom-field/delete/${cfUuid}`);
      return r.data;
    });

    await test('restore_custom_field', async () => {
      const r = await api.post(`/custom-field/restore/${cfUuid}`);
      return r.data;
    });

    // Delete again for final cleanup
    await test('delete_custom_field (final cleanup)', async () => {
      const r = await api.delete(`/custom-field/delete/${cfUuid}`);
      return r.data;
    });
  } else {
    skip('rename_custom_field', 'create_custom_field failed');
    skip('add_or_edit_field_value', 'create_custom_field failed');
    skip('delete_field_value', 'create_custom_field failed');
    skip('delete_custom_field', 'create_custom_field failed');
    skip('restore_custom_field', 'create_custom_field failed');
    skip('delete_custom_field (final cleanup)', 'create_custom_field failed');
  }

  // --- Group J continued: Custom Fields (enum) ---
  console.log('\n--- Group J: Custom Fields (enum) ---');

  const enumField = enumTypeUuid ? await test('create_custom_field (enum)', async () => {
    const r = await api.post(`/custom-field/create/${PROJECT_ID}`, {
      name: 'MCP Test Enum Field',
      type: enumTypeUuid
    });
    return r.data;
  }) : (skip('create_custom_field (enum)', 'No enum type UUID available'), null);

  let enumFieldUuid = null;
  if (enumField) {
    enumFieldUuid = enumField.uuid || enumField.custom_field?.uuid || null;
  }

  if (enumFieldUuid) {
    const enumOption = await test('create_enum_option', async () => {
      const r = await api.post(`/custom-field-enum/create/${enumFieldUuid}`, {
        name: 'Option A'
      });
      return r.data;
    });

    let enumOptionUuid = null;
    if (enumOption) {
      enumOptionUuid = enumOption.uuid || enumOption.custom_field_enum?.uuid || null;
    }

    if (enumOptionUuid) {
      await test('change_enum_option', async () => {
        const r = await api.post(`/custom-field-enum/change/${enumOptionUuid}`, {
          value: 'Option A Modified'
        });
        return r.data;
      });

      await test('add_or_edit_enum_value', async () => {
        const r = await api.post('/custom-field/add-or-edit-enum-value', {
          task_id: testTaskId,
          custom_field_uuid: enumFieldUuid,
          enum_option_uuid: enumOptionUuid
        });
        return r.data;
      });

      // Try delete_enum_option (may fail if values reference it)
      const deleteResult = await test('delete_enum_option', async () => {
        const r = await api.delete(`/custom-field-enum/delete/${enumOptionUuid}`);
        return r.data;
      });

      // If delete failed, try force delete
      if (deleteResult === null) {
        await test('force_delete_enum_option', async () => {
          const r = await api.delete(`/custom-field-enum/force-delete/${enumOptionUuid}`);
          return r.data;
        });
      } else {
        skip('force_delete_enum_option', 'Regular delete succeeded');
      }
    } else {
      skip('change_enum_option', 'create_enum_option failed');
      skip('add_or_edit_enum_value', 'create_enum_option failed');
      skip('delete_enum_option', 'create_enum_option failed');
      skip('force_delete_enum_option', 'create_enum_option failed');
    }

    // Cleanup: delete the enum custom field
    await test('delete_custom_field (enum cleanup)', async () => {
      const r = await api.delete(`/custom-field/delete/${enumFieldUuid}`);
      return r.data;
    });
  } else {
    skip('create_enum_option', 'create_custom_field (enum) failed');
    skip('change_enum_option', 'create_custom_field (enum) failed');
    skip('add_or_edit_enum_value', 'create_custom_field (enum) failed');
    skip('delete_enum_option', 'create_custom_field (enum) failed');
    skip('force_delete_enum_option', 'create_custom_field (enum) failed');
    skip('delete_custom_field (enum cleanup)', 'create_custom_field (enum) failed');
  }

  // --- Task finish/activate/delete (must be last for the test task) ---
  console.log('\n--- Task lifecycle & cleanup ---');

  await test('finish_task', async () => {
    const r = await api.post(`/task/${testTaskId}/finish`);
    return r.data;
  });

  await test('activate_task', async () => {
    const r = await api.post(`/task/${testTaskId}/activate`);
    return r.data;
  });

  await test('delete_task (cleanup)', async () => {
    const r = await api.delete(`/task/${testTaskId}`);
    return r.data;
  });
} else {
  // testTaskId was null - skip all task-dependent write tests
  const taskDependentTests = [
    'edit_task', 'update_task_description', 'get_task_description (after setting)',
    'create_comment', 'edit_comment', 'create_subtask', 'get_subtasks (write task)',
    'move_task', 'set_total_time_estimate', 'delete_total_time_estimate',
    'set_user_time_estimate', 'delete_user_time_estimate',
    'create_task_reminder', 'delete_task_reminder',
    'get_public_link (write task)', 'delete_public_link',
    'pin_item', 'delete_pinned_item',
    'create_work_report', 'update_work_report', 'delete_work_report',
    'start_time_tracking', 'edit_time_tracking', 'stop_time_tracking',
    'create_task_labels', 'add_label_to_project', 'find_available_labels (after create)',
    'add_labels_to_task', 'remove_labels_from_task', 'edit_label',
    'remove_label_from_project', 'delete_label',
    'create_custom_field', 'rename_custom_field', 'add_or_edit_field_value',
    'delete_field_value', 'delete_custom_field', 'restore_custom_field',
    'create_custom_field (enum)', 'create_enum_option', 'change_enum_option',
    'add_or_edit_enum_value', 'delete_enum_option', 'force_delete_enum_option',
    'finish_task', 'activate_task', 'delete_task (cleanup)'
  ];
  taskDependentTests.forEach(name => skip(name, 'create_task failed'));
}


// --- Group E: Notes (4 tools) ---
console.log('\n--- Group E: Notes ---');

const testNote = await test('create_note', async () => {
  const r = await api.post(`/project/${PROJECT_ID}/note`, {
    name: 'MCP Test Note (auto-delete)',
    content: 'Test content from MCP integration test'
  });
  if (!r.data.id) throw new Error('No note id');
  return r.data;
});

const testNoteId = testNote ? String(testNote.id) : null;

if (testNoteId) {
  await test('get_note', async () => {
    const r = await api.get(`/note/${testNoteId}`);
    if (!r.data.id) throw new Error('No id in response');
    return r.data;
  });

  await test('update_note', async () => {
    const r = await api.post(`/note/${testNoteId}`, {
      name: 'MCP Test Note Updated',
      content: 'Updated content from MCP integration test'
    });
    return r.data;
  });

  await test('delete_note', async () => {
    const r = await api.delete(`/note/${testNoteId}`);
    return r.data;
  });
} else {
  skip('get_note', 'create_note failed');
  skip('update_note', 'create_note failed');
  skip('delete_note', 'create_note failed');
}


// --- Group I: Notifications (2 write tools) ---
console.log('\n--- Group I: Notifications ---');

let notificationId = null;
if (Array.isArray(notifications) && notifications.length > 0) {
  notificationId = String(notifications[0].id);
}

if (notificationId) {
  await test('mark_notification_read', async () => {
    const r = await api.post(`/notification/${notificationId}/mark-as-read`);
    return r.data;
  });

  await test('mark_notification_unread', async () => {
    const r = await api.post(`/notification/${notificationId}/mark-as-unread`);
    return r.data;
  });
} else {
  skip('mark_notification_read', 'No notifications found');
  skip('mark_notification_unread', 'No notifications found');
}


// --- Group K: File upload + download, Known Issues ---
console.log('\n--- Group K: File upload + download ---');

// upload_file - test with a small text file
const uploadResult = await test('upload_file', async () => {
  const form = (await import('form-data')).default;
  const formData = new form();
  const fileBuffer = Buffer.from('MCP integration test file content', 'utf-8');
  formData.append('file', fileBuffer, { filename: 'mcp-test.txt', contentType: 'text/plain' });
  const r = await api.post('/file/upload', formData, { headers: formData.getHeaders() });
  if (!r.data.uuid) throw new Error('No UUID in upload response');
  console.log('  upload verified, uuid:', r.data.uuid);
  return r.data;
});

// download_file - uploaded files need to be attached to a task/comment first
// Create a temporary task, attach file via comment, then download
if (uploadResult && uploadResult.uuid) {
  const dlTasklistId = testTasklistId || firstTasklistId;
  if (dlTasklistId) {
    let dlTaskId = null;
    const dlTask = await test('(setup) create task for file download', async () => {
      const r = await api.post(`/project/${PROJECT_ID}/tasklist/${dlTasklistId}/tasks`, {
        name: 'File download test (auto-delete)'
      });
      dlTaskId = String(r.data.id);
      return r.data;
    });

    if (dlTaskId) {
      // Attach file to comment
      await test('(setup) attach file to comment', async () => {
        const r = await api.post(`/task/${dlTaskId}/comments`, {
          content: 'File attachment for download test',
          files: [{ uuid: uploadResult.uuid }]
        });
        if (!r.data.files || r.data.files.length === 0) throw new Error('File not attached');
        return r.data;
      });

      // Now download the file
      await test('download_file', async () => {
        const r = await api.get(`/file/${uploadResult.uuid}`, { responseType: 'arraybuffer' });
        if (!r.data || r.data.length === 0) throw new Error('No file data returned');
        console.log('  downloaded', r.data.length, 'bytes');
        return r.data;
      });

      // Cleanup
      await test('(cleanup) delete file download task', async () => {
        const r = await api.delete(`/task/${dlTaskId}`);
        return r.data;
      });
    } else {
      skip('download_file', 'Could not create task for file attachment');
    }
  } else {
    skip('download_file', 'No tasklist available for task creation');
  }
} else {
  skip('download_file', 'upload_file failed');
}

console.log('\n--- Group K: Other Known Issues ---');

// remove_workers - test with non-existent user (expect 400 = endpoint works)
try {
  await delay(1500);
  await api.post(`/project/${PROJECT_ID}/remove-workers/by-ids`, { users_ids: [99999999] });
  passed++;
  console.log('\x1b[32m✓\x1b[0m', 'remove_workers');
} catch (e) {
  if (e.response && e.response.status === 400) {
    // 400 = user not in project = endpoint works correctly
    passed++;
    console.log('\x1b[32m✓\x1b[0m', 'remove_workers (400 = endpoint works, user not in project)');
  } else {
    failed++;
    const msg = e.response ? `${e.response.status} ${JSON.stringify(e.response.data).substring(0, 150)}` : e.message;
    console.log('\x1b[31m✗\x1b[0m', 'remove_workers', '-', msg);
    failures.push({ name: 'remove_workers', msg });
  }
}

skip('invite_users', 'Risky - would actually invite users');
skip('set_out_of_office', 'May fail - domain not verified');
skip('delete_out_of_office', 'May fail - domain not verified');
skip('mark_as_invoiced', 'Destructive - would mark real invoice as invoiced');

// Template-based creation tools
if (Array.isArray(templateProjects) && templateProjects.length > 0) {
  // We have templates but still skip to avoid creating persistent resources
  skip('create_project_from_template', 'Skipped to avoid creating persistent resources');
  skip('create_tasklist_from_template', 'Skipped to avoid creating persistent resources');
  skip('create_task_from_template', 'Skipped to avoid creating persistent resources');
} else {
  skip('create_project_from_template', 'No template projects available');
  skip('create_tasklist_from_template', 'No template projects available');
  skip('create_task_from_template', 'No template projects available');
}


// ============================================================
// CLEANUP: Delete test tasklist if it was created
// ============================================================

// Note: There's no delete_tasklist endpoint in the API.
// The test tasklist will remain but is named "(auto-delete)" for easy manual cleanup.


// ============================================================
// SUMMARY
// ============================================================

const total = passed + failed + skipped;

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m out of ${total} total`);

if (skippedTests.length > 0) {
  console.log('\nSkipped tests:');
  skippedTests.forEach(s => console.log(`  \x1b[33m⊘\x1b[0m ${s.name}: ${s.reason}`));
}

if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  \x1b[31m✗\x1b[0m ${f.name}: ${f.msg}`));
}

console.log('');
