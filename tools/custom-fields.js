/**
 * CustomFields Tools
 */

import { z } from 'zod';
import { getApiClient } from '../utils/authHelper.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { withErrorHandling } from '../utils/errorHandler.js';
import { registerToolWithMetadata } from '../utils/registerToolWithMetadata.js';
import { unwrapPaginatedResponse } from '../utils/paginationHelper.js';
import { createArrayResponseSchema } from '../utils/schemas.js';

export function registerCustomFieldsTools(server) {
  registerToolWithMetadata(
    server,
    'get_custom_field_types',
    'Fetches all available custom field types in Freelo. Custom fields allow you to extend tasks with additional metadata like priority levels, client names, budget amounts, or any project-specific data. PREMIUM FEATURE: Requires paid Freelo plan. Use this before create_custom_field to see available field types (text, number, date, select, etc.).',
    {},
    withErrorHandling('get_custom_field_types', async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/custom-field/get-types');
      return formatResponse(unwrapPaginatedResponse(response.data));
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), name: z.string() }))
    }
  );

  registerToolWithMetadata(
    server,
    'create_custom_field',
    'Creates a new custom field for a project. Custom fields extend tasks with project-specific metadata (e.g., "Client Name", "Priority Level", "Budget"). PREMIUM FEATURE: Requires paid Freelo plan. After creation, use add_or_edit_field_value to set values on tasks. Get field types from get_custom_field_types first.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects or get_all_projects.'),
      fieldData: z.object({
        name: z.string().describe('Name of the custom field (e.g., "Client Name", "Priority Level", "Budget Amount")'),
        type: z.string().describe('Type of the custom field (e.g., "text", "number", "date", "select"). Get available types from get_custom_field_types.'),
        is_required: z.enum(['yes', 'no']).optional().describe('Whether field is required when creating/editing tasks: "yes" or "no" (default). Required fields must be filled in.')
      }).describe('Custom field data')
    },
    withErrorHandling('create_custom_field', async ({ projectId, fieldData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/custom-field/create/${projectId}`, fieldData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ id: z.string(), name: z.string(), type: z.string() })
    }
  );

  registerToolWithMetadata(
    server,
    'rename_custom_field',
    'Renames an existing custom field. Use this to update the display name of a custom field across the entire project. All existing values are preserved, only the field label changes. PREMIUM FEATURE: Requires paid Freelo plan. Get custom field UUIDs from get_custom_fields_by_project.',
    {
      uuid: z.string().describe('UUID of the custom field to rename (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response.'),
      name: z.string().describe('New name for the custom field (e.g., "Updated Priority Level", "New Client Field")')
    },
    withErrorHandling('rename_custom_field', async ({ uuid, name }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/custom-field/rename/${uuid}`, { name });
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ id: z.string(), name: z.string() })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_custom_field',
    'Deletes a custom field from a project. The field will be removed from all tasks and hidden from views. This is reversible - use restore_custom_field to un-delete. PREMIUM FEATURE: Requires paid Freelo plan. Get custom field UUIDs from get_custom_fields_by_project. Consider renaming instead if you might need it later.',
    {
      uuid: z.string().describe('UUID of the custom field to delete (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response.')
    },
    withErrorHandling('delete_custom_field', async ({ uuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/custom-field/delete/${uuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'restore_custom_field',
    'Restores a previously deleted custom field. The field will become visible again with all its values preserved. Use this to un-delete custom fields that were removed with delete_custom_field. PREMIUM FEATURE: Requires paid Freelo plan. Get deleted field UUIDs from get_custom_fields_by_project.',
    {
      uuid: z.string().describe('UUID of the deleted custom field to restore (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project response (includes deleted fields).')
    },
    withErrorHandling('restore_custom_field', async ({ uuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/custom-field/restore/${uuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ id: z.string(), name: z.string() })
    }
  );

  registerToolWithMetadata(
    server,
    'add_or_edit_field_value',
    'Sets or updates a custom field value on a task. Use this to add metadata like client names, budgets, or priorities to tasks. For enum/select fields, use add_or_edit_enum_value instead. PREMIUM FEATURE: Requires paid Freelo plan. Works with text, number, date, and other non-enum field types.',
    {
      valueData: z.object({
        task_id: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks, get_tasklist_tasks, or get_task_details.'),
        custom_field_uuid: z.string().describe('UUID of the custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project.'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('Value to set. Type depends on field: string for text, number for numeric, boolean for checkbox, "YYYY-MM-DD" for date.')
      }).describe('Field value data')
    },
    withErrorHandling('add_or_edit_field_value', async ({ valueData }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post('/custom-field/add-or-edit-value', valueData);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'add_or_edit_enum_value',
    'Sets or updates an enum/select custom field value on a task. Use this for dropdown/select custom fields (e.g., "Priority: High/Medium/Low", "Status: Approved/Pending/Rejected"). For other field types, use add_or_edit_field_value instead. PREMIUM FEATURE: Requires paid Freelo plan. Get enum options from get_enum_options.',
    {
      valueData: z.object({
        task_id: z.string().describe('Unique task identifier (numeric string, e.g., "12345"). Get from get_all_tasks or get_tasklist_tasks.'),
        custom_field_uuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project.'),
        enum_option_uuid: z.string().describe('UUID of the enum option to select (e.g., "b2c3d4e5-f6a7-8901-bcde-f12345678901"). Get from get_enum_options.')
      }).describe('Enum value data')
    },
    withErrorHandling('add_or_edit_enum_value', async ({ valueData }) => {
      const apiClient = getApiClient();
      // The Freelo API expects `value`, not `enum_option_uuid` — sending the
      // wrong field name resulted in a 400 with "Expected a string. Got: NULL"
      // (#13). Keep the schema's user-facing key intact for backwards
      // compatibility but rename it on the wire.
      const { enum_option_uuid, ...rest } = valueData;
      const payload = { ...rest, value: enum_option_uuid };
      const response = await apiClient.post('/custom-field/add-or-edit-enum-value', payload);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_field_value',
    'Deletes a custom field value from a task. Use this to clear/remove custom field data from a task. The custom field definition remains, only this specific task\'s value is removed. PREMIUM FEATURE: Requires paid Freelo plan. Get value UUIDs from task details or get_custom_fields_by_project response.',
    {
      uuid: z.string().describe('UUID of the field value to delete (e.g., "c3d4e5f6-a7b8-9012-cdef-123456789012"). Get from task details in get_task_details response or get_custom_fields_by_project.')
    },
    withErrorHandling('delete_field_value', async ({ uuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/custom-field/delete-value/${uuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ success: z.boolean() })
    }
  );

  registerToolWithMetadata(
    server,
    'get_custom_fields_by_project',
    'Fetches all custom fields defined in a specific project, including their UUIDs, types, and configurations. Essential for understanding which custom fields are available before setting values on tasks. PREMIUM FEATURE: Requires paid Freelo plan. Returns both active and deleted fields.',
    {
      projectId: z.string().describe('Unique project identifier (numeric string, e.g., "197352"). Get from get_projects, get_all_projects, or get_project_details.')
    },
    withErrorHandling('get_custom_fields_by_project', async ({ projectId }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/custom-field/find-by-project/${projectId}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), name: z.string(), type: z.string() }))
    }
  );

  registerToolWithMetadata(
    server,
    'get_enum_options',
    'Fetches all available options for an enum/select custom field. Use this to see what values can be selected before using add_or_edit_enum_value. Returns option UUIDs, names, and colors. PREMIUM FEATURE: Requires paid Freelo plan. Only works with enum/select type fields.',
    {
      customFieldUuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project for enum-type fields.')
    },
    withErrorHandling('get_enum_options', async ({ customFieldUuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/custom-field-enum/get-for-custom-field/${customFieldUuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: createArrayResponseSchema(z.object({ id: z.string(), value: z.string() }))
    }
  );

  registerToolWithMetadata(
    server,
    'change_enum_option',
    'Renames an existing enum/select custom field option. Use this to update option labels without changing which tasks have it selected. PREMIUM FEATURE: Requires paid Freelo plan. Get option UUIDs from get_enum_options.',
    {
      enumUuid: z.string().describe('UUID of the enum option to rename (e.g., "b2c3d4e5-f6a7-8901-bcde-f12345678901"). Get from get_enum_options.'),
      value: z.string().describe('New value/name for the option (e.g., "Critical Priority", "Approved")')
    },
    withErrorHandling('change_enum_option', async ({ enumUuid, value }) => {
      const apiClient = getApiClient();
      const response = await apiClient.post(`/custom-field-enum/change/${enumUuid}`, { value });
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ custom_field_enum: z.object({ uuid: z.string(), value: z.string() }) })
    }
  );

  registerToolWithMetadata(
    server,
    'delete_enum_option',
    'Deletes an enum/select custom field option. Fails if the option is currently in use on any task. Use force_delete_enum_option to delete even if in use. PREMIUM FEATURE: Requires paid Freelo plan. Get option UUIDs from get_enum_options.',
    {
      enumUuid: z.string().describe('UUID of the enum option to delete (e.g., "b2c3d4e5-f6a7-8901-bcde-f12345678901"). Get from get_enum_options.')
    },
    withErrorHandling('delete_enum_option', async ({ enumUuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/custom-field-enum/delete/${enumUuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  registerToolWithMetadata(
    server,
    'force_delete_enum_option',
    'Force-deletes an enum/select custom field option even if it is currently in use on tasks. Tasks with this option will have the value cleared. PREMIUM FEATURE: Requires paid Freelo plan. Use regular delete_enum_option first if unsure.',
    {
      enumUuid: z.string().describe('UUID of the enum option to force-delete (e.g., "b2c3d4e5-f6a7-8901-bcde-f12345678901"). Get from get_enum_options.')
    },
    withErrorHandling('force_delete_enum_option', async ({ enumUuid }) => {
      const apiClient = getApiClient();
      const response = await apiClient.delete(`/custom-field-enum/force-delete/${enumUuid}`);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ result: z.string() })
    }
  );

  registerToolWithMetadata(
    server,
    'create_enum_option',
    'Creates a new option for an enum/select custom field. Use this to add new values to dropdown fields (e.g., add "Critical" to a "Priority" field). After creation, use add_or_edit_enum_value to assign this option to tasks. PREMIUM FEATURE: Requires paid Freelo plan. Only works with enum/select type fields.',
    {
      customFieldUuid: z.string().describe('UUID of the enum custom field (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"). Get from get_custom_fields_by_project for enum-type fields.'),
      optionData: z.object({
        name: z.string().describe('Name of the new option (e.g., "High Priority", "Approved", "Phase 2"). Will appear in dropdown.'),
        color: z.string().optional().describe('Optional: Color for the option in hex format (e.g., "#FF0000" for red, "#00FF00" for green). Used for visual distinction.')
      }).describe('Enum option data')
    },
    withErrorHandling('create_enum_option', async ({ customFieldUuid, optionData }) => {
      const apiClient = getApiClient();
      // Freelo expects `value`, not `name`, on this endpoint — sending
      // `name` returned `Expected a string. Got: NULL` because the
      // required `value` field was missing (#13). Translate before send.
      const payload = { value: optionData.name };
      if (optionData.color) {
        payload.color = optionData.color;
      }
      const response = await apiClient.post(`/custom-field-enum/create/${customFieldUuid}`, payload);
      return formatResponse(response.data);
    }),
    {
      outputSchema: z.object({ id: z.string(), value: z.string() })
    }
  );
}
