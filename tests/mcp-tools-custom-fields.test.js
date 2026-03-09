/**
 * Tests for custom fields MCP tools
 */

import { jest } from '@jest/globals';
import nock from 'nock';

// Define a registry in the test file scope
const mockToolsRegistry = {};

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: jest.fn().mockImplementation(() => ({
      tool: (name, schema, handler) => {
        mockToolsRegistry[name] = { schema, handler };
      },
      registerTool: (name, config, handler) => {
        mockToolsRegistry[name] = { config, handler };
      },
      getTools: () => mockToolsRegistry,
    }))
  };
});

// Import test helpers
import {
  TEST_DATA,
  TEST_ENV,
  setupTestEnv,
  isValidResponse,
  getResponseData,
  setupNock,
  cleanupNock,
  mockFreeloApi
} from './test-helpers.js';

// Set up mock environment variables *before* importing the server
setupTestEnv();

// Dynamic import AFTER mock is set up (required for ESM mocking)
const { initializeMcpServer } = await import('../mcp-server.js');

// Mock UUIDs for custom fields testing
const CUSTOM_FIELD_UUID = 'cf-uuid-1234-5678-abcd-ef0123456789';
const CUSTOM_FIELD_VALUE_UUID = 'cfv-uuid-2345-6789-bcde-f01234567890';
const ENUM_OPTION_UUID = 'eo-uuid-3456-7890-cdef-012345678901';

describe('Custom Fields Tools', () => {
  let tools;

  beforeAll(() => {
    initializeMcpServer();
    tools = mockToolsRegistry;
  });

  beforeEach(() => {
    setupNock();
  });

  afterEach(() => {
    cleanupNock();
  });

  // Test get_custom_field_types
  describe('get_custom_field_types', () => {
    it('should return custom field types successfully', async () => {
      const mockTypes = [
        { id: 'text', name: 'Text' },
        { id: 'number', name: 'Number' },
        { id: 'date', name: 'Date' },
        { id: 'select', name: 'Select' }
      ];
      mockFreeloApi('GET', '/custom-field/get-types', 200, mockTypes);

      const result = await tools.get_custom_field_types.handler({});

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(4);
      expect(data[0]).toHaveProperty('id', 'text');
      expect(data[0]).toHaveProperty('name', 'Text');
    });

    it('should handle errors', async () => {
      mockFreeloApi('GET', '/custom-field/get-types', 403, {
        error: 'Forbidden',
        message: 'Premium feature required'
      });

      const result = await tools.get_custom_field_types.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test create_custom_field
  describe('create_custom_field', () => {
    it('should create a custom field successfully', async () => {
      const fieldData = {
        name: 'Priority Level',
        type: 'select',
        is_required: 'no'
      };
      const mockResponse = {
        id: CUSTOM_FIELD_UUID,
        name: 'Priority Level',
        type: 'select'
      };
      mockFreeloApi('POST', `/custom-field/create/${TEST_DATA.projectId}`, 200, mockResponse, fieldData);

      const result = await tools.create_custom_field.handler({
        projectId: TEST_DATA.projectId,
        fieldData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', CUSTOM_FIELD_UUID);
      expect(data).toHaveProperty('name', 'Priority Level');
      expect(data).toHaveProperty('type', 'select');
    });

    it('should handle errors when creating a custom field', async () => {
      const fieldData = {
        name: 'Bad Field',
        type: 'invalid_type'
      };
      mockFreeloApi('POST', `/custom-field/create/${TEST_DATA.projectId}`, 400, {
        error: 'Bad Request',
        message: 'Invalid field type'
      }, fieldData);

      const result = await tools.create_custom_field.handler({
        projectId: TEST_DATA.projectId,
        fieldData
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test rename_custom_field
  describe('rename_custom_field', () => {
    it('should rename a custom field successfully', async () => {
      const mockResponse = {
        id: CUSTOM_FIELD_UUID,
        name: 'Updated Priority'
      };
      mockFreeloApi('POST', `/custom-field/rename/${CUSTOM_FIELD_UUID}`, 200, mockResponse, { name: 'Updated Priority' });

      const result = await tools.rename_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID,
        name: 'Updated Priority'
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', CUSTOM_FIELD_UUID);
      expect(data).toHaveProperty('name', 'Updated Priority');
    });

    it('should handle errors when renaming a custom field', async () => {
      mockFreeloApi('POST', `/custom-field/rename/${CUSTOM_FIELD_UUID}`, 404, {
        error: 'Not Found',
        message: 'Custom field not found'
      }, { name: 'New Name' });

      const result = await tools.rename_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID,
        name: 'New Name'
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test delete_custom_field
  describe('delete_custom_field', () => {
    it('should delete a custom field successfully', async () => {
      const mockResponse = { success: true };
      mockFreeloApi('DELETE', `/custom-field/delete/${CUSTOM_FIELD_UUID}`, 200, mockResponse);

      const result = await tools.delete_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when deleting a custom field', async () => {
      mockFreeloApi('DELETE', `/custom-field/delete/${CUSTOM_FIELD_UUID}`, 404, {
        error: 'Not Found',
        message: 'Custom field not found'
      });

      const result = await tools.delete_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test restore_custom_field
  describe('restore_custom_field', () => {
    it('should restore a deleted custom field successfully', async () => {
      const mockResponse = {
        id: CUSTOM_FIELD_UUID,
        name: 'Restored Field'
      };
      mockFreeloApi('POST', `/custom-field/restore/${CUSTOM_FIELD_UUID}`, 200, mockResponse);

      const result = await tools.restore_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', CUSTOM_FIELD_UUID);
      expect(data).toHaveProperty('name', 'Restored Field');
    });

    it('should handle errors when restoring a custom field', async () => {
      mockFreeloApi('POST', `/custom-field/restore/${CUSTOM_FIELD_UUID}`, 404, {
        error: 'Not Found',
        message: 'Custom field not found'
      });

      const result = await tools.restore_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test add_or_edit_field_value
  describe('add_or_edit_field_value', () => {
    it('should add a field value successfully', async () => {
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        value: 'High Priority'
      };
      const mockResponse = { success: true };
      mockFreeloApi('POST', '/custom-field/add-or-edit-value', 200, mockResponse, valueData);

      const result = await tools.add_or_edit_field_value.handler({ valueData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should add a numeric field value successfully', async () => {
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        value: 42
      };
      const mockResponse = { success: true };
      mockFreeloApi('POST', '/custom-field/add-or-edit-value', 200, mockResponse, valueData);

      const result = await tools.add_or_edit_field_value.handler({ valueData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when adding a field value', async () => {
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        value: 'some value'
      };
      mockFreeloApi('POST', '/custom-field/add-or-edit-value', 400, {
        error: 'Bad Request',
        message: 'Invalid value for field type'
      }, valueData);

      const result = await tools.add_or_edit_field_value.handler({ valueData });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test add_or_edit_enum_value
  describe('add_or_edit_enum_value', () => {
    it('should add an enum value successfully', async () => {
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        enum_option_uuid: ENUM_OPTION_UUID
      };
      const mockResponse = { success: true };
      mockFreeloApi('POST', '/custom-field/add-or-edit-enum-value', 200, mockResponse, valueData);

      const result = await tools.add_or_edit_enum_value.handler({ valueData });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when adding an enum value', async () => {
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        enum_option_uuid: 'invalid-uuid'
      };
      mockFreeloApi('POST', '/custom-field/add-or-edit-enum-value', 400, {
        error: 'Bad Request',
        message: 'Invalid enum option'
      }, valueData);

      const result = await tools.add_or_edit_enum_value.handler({ valueData });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test delete_field_value
  describe('delete_field_value', () => {
    it('should delete a field value successfully', async () => {
      const mockResponse = { success: true };
      mockFreeloApi('DELETE', `/custom-field/delete-value/${CUSTOM_FIELD_VALUE_UUID}`, 200, mockResponse);

      const result = await tools.delete_field_value.handler({
        uuid: CUSTOM_FIELD_VALUE_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('success', true);
    });

    it('should handle errors when deleting a field value', async () => {
      mockFreeloApi('DELETE', `/custom-field/delete-value/${CUSTOM_FIELD_VALUE_UUID}`, 404, {
        error: 'Not Found',
        message: 'Field value not found'
      });

      const result = await tools.delete_field_value.handler({
        uuid: CUSTOM_FIELD_VALUE_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test get_custom_fields_by_project
  describe('get_custom_fields_by_project', () => {
    it('should return custom fields for a project successfully', async () => {
      const mockFields = [
        { id: CUSTOM_FIELD_UUID, name: 'Priority', type: 'select' },
        { id: 'cf-uuid-second', name: 'Client Name', type: 'text' }
      ];
      mockFreeloApi('GET', `/custom-field/find-by-project/${TEST_DATA.projectId}`, 200, mockFields);

      const result = await tools.get_custom_fields_by_project.handler({
        projectId: TEST_DATA.projectId
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', CUSTOM_FIELD_UUID);
      expect(data[0]).toHaveProperty('name', 'Priority');
      expect(data[0]).toHaveProperty('type', 'select');
      expect(data[1]).toHaveProperty('type', 'text');
    });

    it('should handle errors when fetching custom fields', async () => {
      mockFreeloApi('GET', `/custom-field/find-by-project/${TEST_DATA.projectId}`, 404, {
        error: 'Not Found',
        message: 'Project not found'
      });

      const result = await tools.get_custom_fields_by_project.handler({
        projectId: TEST_DATA.projectId
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test get_enum_options
  describe('get_enum_options', () => {
    it('should return enum options successfully', async () => {
      const mockOptions = [
        { id: ENUM_OPTION_UUID, value: 'High' },
        { id: 'eo-uuid-second', value: 'Medium' },
        { id: 'eo-uuid-third', value: 'Low' }
      ];
      mockFreeloApi('GET', `/custom-field-enum/get-for-custom-field/${CUSTOM_FIELD_UUID}`, 200, mockOptions);

      const result = await tools.get_enum_options.handler({
        customFieldUuid: CUSTOM_FIELD_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
      expect(data[0]).toHaveProperty('id', ENUM_OPTION_UUID);
      expect(data[0]).toHaveProperty('value', 'High');
    });

    it('should handle errors when fetching enum options', async () => {
      mockFreeloApi('GET', `/custom-field-enum/get-for-custom-field/${CUSTOM_FIELD_UUID}`, 404, {
        error: 'Not Found',
        message: 'Custom field not found'
      });

      const result = await tools.get_enum_options.handler({
        customFieldUuid: CUSTOM_FIELD_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test create_enum_option
  describe('create_enum_option', () => {
    it('should create an enum option successfully', async () => {
      const optionData = {
        name: 'Critical',
        color: '#FF0000'
      };
      const mockResponse = {
        id: ENUM_OPTION_UUID,
        value: 'Critical'
      };
      mockFreeloApi('POST', `/custom-field-enum/create/${CUSTOM_FIELD_UUID}`, 200, mockResponse, optionData);

      const result = await tools.create_enum_option.handler({
        customFieldUuid: CUSTOM_FIELD_UUID,
        optionData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', ENUM_OPTION_UUID);
      expect(data).toHaveProperty('value', 'Critical');
    });

    it('should create an enum option without color', async () => {
      const optionData = {
        name: 'Low Priority'
      };
      const mockResponse = {
        id: 'eo-uuid-new',
        value: 'Low Priority'
      };
      mockFreeloApi('POST', `/custom-field-enum/create/${CUSTOM_FIELD_UUID}`, 200, mockResponse, optionData);

      const result = await tools.create_enum_option.handler({
        customFieldUuid: CUSTOM_FIELD_UUID,
        optionData
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('id', 'eo-uuid-new');
      expect(data).toHaveProperty('value', 'Low Priority');
    });

    it('should handle errors when creating an enum option', async () => {
      const optionData = { name: 'Duplicate' };
      mockFreeloApi('POST', `/custom-field-enum/create/${CUSTOM_FIELD_UUID}`, 400, {
        error: 'Bad Request',
        message: 'Option already exists'
      }, optionData);

      const result = await tools.create_enum_option.handler({
        customFieldUuid: CUSTOM_FIELD_UUID,
        optionData
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test change_enum_option
  describe('change_enum_option', () => {
    it('should change an enum option value successfully', async () => {
      const mockResponse = {
        custom_field_enum: {
          uuid: ENUM_OPTION_UUID,
          value: 'Very High'
        }
      };
      mockFreeloApi('POST', `/custom-field-enum/change/${ENUM_OPTION_UUID}`, 200, mockResponse, { value: 'Very High' });

      const result = await tools.change_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID,
        value: 'Very High'
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('custom_field_enum');
      expect(data.custom_field_enum).toHaveProperty('uuid', ENUM_OPTION_UUID);
      expect(data.custom_field_enum).toHaveProperty('value', 'Very High');
    });

    it('should handle errors when changing an enum option', async () => {
      mockFreeloApi('POST', `/custom-field-enum/change/${ENUM_OPTION_UUID}`, 404, {
        error: 'Not Found',
        message: 'Enum option not found'
      }, { value: 'New Value' });

      const result = await tools.change_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID,
        value: 'New Value'
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test delete_enum_option
  describe('delete_enum_option', () => {
    it('should delete an enum option successfully', async () => {
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', `/custom-field-enum/delete/${ENUM_OPTION_UUID}`, 200, mockResponse);

      const result = await tools.delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when option is in use', async () => {
      mockFreeloApi('DELETE', `/custom-field-enum/delete/${ENUM_OPTION_UUID}`, 409, {
        error: 'Conflict',
        message: 'Enum option is in use. Use force-delete instead.'
      });

      const result = await tools.delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test force_delete_enum_option
  describe('force_delete_enum_option', () => {
    it('should force-delete an enum option successfully', async () => {
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', `/custom-field-enum/force-delete/${ENUM_OPTION_UUID}`, 200, mockResponse);

      const result = await tools.force_delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });

      expect(isValidResponse(result)).toBe(true);
      const data = getResponseData(result);
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when force-deleting an enum option', async () => {
      mockFreeloApi('DELETE', `/custom-field-enum/force-delete/${ENUM_OPTION_UUID}`, 404, {
        error: 'Not Found',
        message: 'Enum option not found'
      });

      const result = await tools.force_delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test full custom fields workflow
  describe('custom fields workflow', () => {
    it('should handle create, set value, and delete workflow', async () => {
      // 1. Get field types
      const mockTypes = [
        { id: 'text', name: 'Text' },
        { id: 'select', name: 'Select' }
      ];
      mockFreeloApi('GET', '/custom-field/get-types', 200, mockTypes);
      const typesResult = await tools.get_custom_field_types.handler({});
      expect(isValidResponse(typesResult)).toBe(true);
      const types = getResponseData(typesResult);
      expect(Array.isArray(types)).toBe(true);

      // 2. Create a text custom field
      const fieldData = { name: 'Client Name', type: 'text' };
      const mockCreatedField = { id: CUSTOM_FIELD_UUID, name: 'Client Name', type: 'text' };
      mockFreeloApi('POST', `/custom-field/create/${TEST_DATA.projectId}`, 200, mockCreatedField, fieldData);
      const createResult = await tools.create_custom_field.handler({
        projectId: TEST_DATA.projectId,
        fieldData
      });
      expect(isValidResponse(createResult)).toBe(true);
      const createdField = getResponseData(createResult);
      expect(createdField).toHaveProperty('id', CUSTOM_FIELD_UUID);

      // 3. Set a value on a task
      const valueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        value: 'Acme Corp'
      };
      mockFreeloApi('POST', '/custom-field/add-or-edit-value', 200, { success: true }, valueData);
      const valueResult = await tools.add_or_edit_field_value.handler({ valueData });
      expect(isValidResponse(valueResult)).toBe(true);
      expect(getResponseData(valueResult)).toHaveProperty('success', true);

      // 4. Get custom fields for project
      mockFreeloApi('GET', `/custom-field/find-by-project/${TEST_DATA.projectId}`, 200, [mockCreatedField]);
      const fieldsResult = await tools.get_custom_fields_by_project.handler({
        projectId: TEST_DATA.projectId
      });
      expect(isValidResponse(fieldsResult)).toBe(true);
      const fields = getResponseData(fieldsResult);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBe(1);

      // 5. Rename the field
      mockFreeloApi('POST', `/custom-field/rename/${CUSTOM_FIELD_UUID}`, 200, {
        id: CUSTOM_FIELD_UUID,
        name: 'Customer Name'
      }, { name: 'Customer Name' });
      const renameResult = await tools.rename_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID,
        name: 'Customer Name'
      });
      expect(isValidResponse(renameResult)).toBe(true);
      expect(getResponseData(renameResult)).toHaveProperty('name', 'Customer Name');

      // 6. Delete field value
      mockFreeloApi('DELETE', `/custom-field/delete-value/${CUSTOM_FIELD_VALUE_UUID}`, 200, { success: true });
      const deleteValueResult = await tools.delete_field_value.handler({
        uuid: CUSTOM_FIELD_VALUE_UUID
      });
      expect(isValidResponse(deleteValueResult)).toBe(true);
      expect(getResponseData(deleteValueResult)).toHaveProperty('success', true);

      // 7. Delete the field
      mockFreeloApi('DELETE', `/custom-field/delete/${CUSTOM_FIELD_UUID}`, 200, { success: true });
      const deleteResult = await tools.delete_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });
      expect(isValidResponse(deleteResult)).toBe(true);
      expect(getResponseData(deleteResult)).toHaveProperty('success', true);

      // 8. Restore the field
      mockFreeloApi('POST', `/custom-field/restore/${CUSTOM_FIELD_UUID}`, 200, {
        id: CUSTOM_FIELD_UUID,
        name: 'Customer Name'
      });
      const restoreResult = await tools.restore_custom_field.handler({
        uuid: CUSTOM_FIELD_UUID
      });
      expect(isValidResponse(restoreResult)).toBe(true);
      expect(getResponseData(restoreResult)).toHaveProperty('id', CUSTOM_FIELD_UUID);
    });
  });

  // Test enum workflow
  describe('enum custom fields workflow', () => {
    it('should handle enum create, options, and assignment workflow', async () => {
      // 1. Create an enum custom field
      const fieldData = { name: 'Priority', type: 'select' };
      const mockCreatedField = { id: CUSTOM_FIELD_UUID, name: 'Priority', type: 'select' };
      mockFreeloApi('POST', `/custom-field/create/${TEST_DATA.projectId}`, 200, mockCreatedField, fieldData);
      const createFieldResult = await tools.create_custom_field.handler({
        projectId: TEST_DATA.projectId,
        fieldData
      });
      expect(isValidResponse(createFieldResult)).toBe(true);

      // 2. Create enum options
      const option1Data = { name: 'High', color: '#FF0000' };
      mockFreeloApi('POST', `/custom-field-enum/create/${CUSTOM_FIELD_UUID}`, 200, {
        id: ENUM_OPTION_UUID,
        value: 'High'
      }, option1Data);
      const createOption1Result = await tools.create_enum_option.handler({
        customFieldUuid: CUSTOM_FIELD_UUID,
        optionData: option1Data
      });
      expect(isValidResponse(createOption1Result)).toBe(true);
      expect(getResponseData(createOption1Result)).toHaveProperty('value', 'High');

      // 3. Get enum options
      const mockOptions = [
        { id: ENUM_OPTION_UUID, value: 'High' },
        { id: 'eo-uuid-low', value: 'Low' }
      ];
      mockFreeloApi('GET', `/custom-field-enum/get-for-custom-field/${CUSTOM_FIELD_UUID}`, 200, mockOptions);
      const getOptionsResult = await tools.get_enum_options.handler({
        customFieldUuid: CUSTOM_FIELD_UUID
      });
      expect(isValidResponse(getOptionsResult)).toBe(true);
      const options = getResponseData(getOptionsResult);
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(2);

      // 4. Change an enum option value
      mockFreeloApi('POST', `/custom-field-enum/change/${ENUM_OPTION_UUID}`, 200, {
        custom_field_enum: { uuid: ENUM_OPTION_UUID, value: 'Critical' }
      }, { value: 'Critical' });
      const changeResult = await tools.change_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID,
        value: 'Critical'
      });
      expect(isValidResponse(changeResult)).toBe(true);
      expect(getResponseData(changeResult).custom_field_enum).toHaveProperty('value', 'Critical');

      // 5. Assign enum value to task
      const enumValueData = {
        task_id: TEST_DATA.taskId,
        custom_field_uuid: CUSTOM_FIELD_UUID,
        enum_option_uuid: ENUM_OPTION_UUID
      };
      mockFreeloApi('POST', '/custom-field/add-or-edit-enum-value', 200, { success: true }, enumValueData);
      const assignResult = await tools.add_or_edit_enum_value.handler({ valueData: enumValueData });
      expect(isValidResponse(assignResult)).toBe(true);
      expect(getResponseData(assignResult)).toHaveProperty('success', true);

      // 6. Delete enum option (should fail if in use)
      mockFreeloApi('DELETE', `/custom-field-enum/delete/${ENUM_OPTION_UUID}`, 409, {
        error: 'Conflict',
        message: 'Option is in use'
      });
      const deleteResult = await tools.delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });
      expect(deleteResult.isError).toBe(true);

      // 7. Force delete enum option
      mockFreeloApi('DELETE', `/custom-field-enum/force-delete/${ENUM_OPTION_UUID}`, 200, { result: 'success' });
      const forceDeleteResult = await tools.force_delete_enum_option.handler({
        enumUuid: ENUM_OPTION_UUID
      });
      expect(isValidResponse(forceDeleteResult)).toBe(true);
      expect(getResponseData(forceDeleteResult)).toHaveProperty('result', 'success');
    });
  });
});
