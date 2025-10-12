/**
 * Tool Annotations Configuration
 * Defines behavioral hints for MCP tools
 */

/**
 * READ-ONLY TOOLS (readOnlyHint: true)
 * These tools only read data and don't modify anything
 */
export const READ_ONLY_TOOLS = [
  // Projects
  'get_projects',
  'get_all_projects',
  'get_project_details',
  'get_invited_projects',
  'get_archived_projects',
  'get_template_projects',
  'get_user_projects',
  'get_project_manager_of',
  'get_project_workers',

  // Tasks
  'get_all_tasks',
  'get_tasklist_tasks',
  'get_finished_tasks',
  'get_task_details',
  'get_task_description',
  'get_public_link',

  // Tasklists
  'get_project_tasklists',
  'get_tasklist_details',
  'get_assignable_workers',

  // Subtasks
  'get_subtasks',

  // Files
  'get_all_files',
  'download_file',

  // Users
  'get_users',
  'get_out_of_office',

  // Time Tracking & Reports
  'get_work_reports',

  // Custom Fields
  'get_custom_field_types',
  'get_custom_fields_by_project',
  'get_enum_options',

  // Labels
  'find_available_labels',

  // States
  'get_all_states',

  // Events
  'get_events',

  // Notes
  'get_note',

  // Notifications
  'get_all_notifications',

  // Pinned Items
  'get_pinned_items',

  // Filters
  'get_custom_filters',
  'get_tasks_by_filter_uuid',
  'get_tasks_by_filter_name',

  // Invoicing
  'get_issued_invoices',
  'get_invoice_detail',
  'download_invoice_reports',

  // Comments
  'get_all_comments',

  // Search
  'search_elasticsearch'
];

/**
 * DESTRUCTIVE TOOLS (destructiveHint: true)
 * These tools can permanently delete or destroy data
 */
export const DESTRUCTIVE_TOOLS = [
  // Projects
  'delete_project',

  // Tasks
  'delete_task',
  'delete_public_link',
  'delete_task_reminder',
  'delete_total_time_estimate',
  'delete_user_time_estimate',

  // Tasklists
  // (Note: No explicit delete tasklist endpoint found)

  // Subtasks
  // (Subtasks are deleted via delete_task)

  // Files
  // (Note: No explicit delete file endpoint found)

  // Users
  'remove_workers',
  'remove_workers_by_emails',
  'delete_out_of_office',

  // Time Tracking
  'delete_work_report',

  // Custom Fields
  'delete_custom_field',
  'delete_field_value',

  // Notes
  'delete_note',

  // Pinned Items
  'delete_pinned_item'
];

/**
 * IDEMPOTENT TOOLS (idempotentHint: true)
 * Calling these tools multiple times with same arguments has no additional effect
 */
export const IDEMPOTENT_TOOLS = [
  // Projects
  'archive_project',      // Archive again = no change
  'activate_project',     // Activate again = no change

  // Tasks
  'finish_task',          // Finish again = no change
  'activate_task',        // Activate again = no change
  'move_task',            // Move to same tasklist = no change
  'update_task_description', // Update to same text = no change

  // Tasks - Editing (updating to same values)
  'edit_task',            // Update with same data = no change

  // Users
  'set_out_of_office',    // Set same OOO = no change

  // Time Tracking
  'update_work_report',   // Update to same values = no change
  'edit_time_tracking',   // Update to same values = no change
  'stop_time_tracking',   // Stop when already stopped = no change

  // Custom Fields
  'rename_custom_field',  // Rename to same name = no change
  'restore_custom_field', // Restore again = no change
  'add_or_edit_field_value', // Set same value = no change
  'add_or_edit_enum_value',  // Set same enum = no change

  // Notifications
  'mark_notification_read',   // Mark read when already read = no change
  'mark_notification_unread', // Mark unread when already unread = no change

  // Invoicing
  'mark_as_invoiced'      // Mark invoiced again = no change
];

/**
 * Get annotations for a specific tool
 * @param {string} toolName - Name of the tool
 * @returns {object} Annotations object
 */
export function getAnnotations(toolName) {
  const annotations = {
    // All Freelo tools interact only with Freelo API (closed world)
    openWorldHint: false
  };

  // Check if read-only
  if (READ_ONLY_TOOLS.includes(toolName)) {
    annotations.readOnlyHint = true;
    return annotations; // Read-only tools don't need other hints
  }

  // Not read-only
  annotations.readOnlyHint = false;

  // Check if destructive
  if (DESTRUCTIVE_TOOLS.includes(toolName)) {
    annotations.destructiveHint = true;
  } else {
    annotations.destructiveHint = false;
  }

  // Check if idempotent
  if (IDEMPOTENT_TOOLS.includes(toolName)) {
    annotations.idempotentHint = true;
  } else {
    annotations.idempotentHint = false;
  }

  return annotations;
}

/**
 * Get human-readable title for a tool
 * @param {string} toolName - Name of the tool
 * @returns {string|undefined} Title or undefined
 */
export function getToolTitle(toolName) {
  // Convert snake_case to Title Case
  // e.g., "get_all_tasks" -> "Get All Tasks"
  const words = toolName.split('_');
  const title = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return title;
}
