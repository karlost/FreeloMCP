/**
 * Tests for MCP tools
 */

import { jest } from '@jest/globals';

// Define a registry in the test file scope
const mockToolsRegistry = {};

// Explicitly mock the MCP server SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: jest.fn().mockImplementation(() => ({
      tool: (name, schema, handler) => {
        // Populate the registry defined in the outer scope
        mockToolsRegistry[name] = { schema, handler };
      },
      getTools: () => mockToolsRegistry, // Return the same registry
    }))
  };
});
// Load environment variables - Removing this call within the test file.
// Mock environment should be handled by setupTestEnv in test-helpers.

// Import test helpers *after* the mock definition
import {
  TEST_DATA,
  setupTestEnv, // Import setupTestEnv
  isValidResponse,
  getResponseData,
  randomString,
  dateString,
  setupNock,
  cleanupNock,
  mockFreeloApi
} from './test-helpers.js';

// Set up mock environment variables *before* importing the server
setupTestEnv();

// Import the initializer function from the server file AFTER mocking SDK and importing helpers.
import { initializeMcpServer } from '../mcp-server.js';

// No longer need to import McpServer directly here as we use the automock
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Removed duplicate import on next line

describe('MCP Tools', () => {
  // let mcpServer; // Instance not needed directly
  let tools; // Variable to hold the registry

  beforeAll(() => {
    // setupTestEnv(); // Moved to top level

    // Initialize the server (which uses the mocked McpServer) AFTER setting up env vars
    // This call populates the mockToolsRegistry via the mocked McpServer.tool method
    initializeMcpServer();
    // Assign the locally defined registry (populated by the mock during initialization)
    tools = mockToolsRegistry;
  });

  // No need to cleanup env vars here anymore as mocks handle API interaction
  // afterAll(() => {
  //   cleanupTestEnv();
  // });

  // Setup nock before each test
  beforeEach(() => {
    setupNock();
  });

  // Clean up nock after each test
  afterEach(() => {
    cleanupNock();
  });

  // Test get_projects tool
  describe('get_projects', () => {
    it('should return projects successfully using mocks', async () => {
      // Mock the API call
      const mockProjects = [{ id: TEST_DATA.projectId, name: 'Mock Project 1' }];
      mockFreeloApi('GET', '/projects', 200, mockProjects);

      // Call the tool handler
      const result = await tools.get_projects.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains projects
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test get_all_projects tool
  describe('get_all_projects', () => {
    it('should return all projects successfully using mocks', async () => {
      // Mock the API call
      const mockAllProjects = [
        { id: TEST_DATA.projectId, name: 'Mock Project 1' },
        { id: 'mockProject999', name: 'Mock Project 2' }
      ];
      mockFreeloApi('GET', '/all-projects', 200, mockAllProjects);

      // Call the tool handler
      const result = await tools.get_all_projects.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains projects
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test create_project tool
  describe('create_project', () => {
    it('should create a project successfully using mocks', async () => {
      // Create project data
      const projectName = `Test Project ${randomString(5)}`;
      const projectData = {
        name: projectName,
        currency_iso: 'CZK',
        project_owner_id: TEST_DATA.userId
      };

      // Mock the API call (match request body)
      const mockCreatedProject = { ...projectData, id: TEST_DATA.projectId + '-new' };
      mockFreeloApi('POST', '/projects', 200, mockCreatedProject, projectData);

      // Call the tool handler
      const result = await tools.create_project.handler({
        projectData
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains the created project
      expect(data).toHaveProperty('id', mockCreatedProject.id);
      expect(data).toHaveProperty('name', projectName);
    });

    it('should handle errors when creating a project', async () => {
      // Create project data with missing required field
      const projectData = {
        name: 'Test Project Error',
        // Missing currency_iso which is required
      };

      // Mock the API call with error response
      mockFreeloApi('POST', '/projects', 400, {
        error: 'Bad Request',
        message: 'Missing required field: currency_iso'
      }, projectData);

      // Call the tool handler
      const result = await tools.create_project.handler({
        projectData
      });

      // Check that the result is an error
      expect(result.isError).toBe(true);

      // Parse the error data
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test get_project_details tool
  describe('get_project_details', () => {
    it('should return project details successfully using mocks', async () => {
      // Mock the API call
      const mockProjectDetails = { id: TEST_DATA.projectId, name: 'Mock Project Details', state_id: 1 };
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}`, 200, mockProjectDetails);

      // Call the tool handler
      const result = await tools.get_project_details.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains project details
      expect(data).toHaveProperty('id', TEST_DATA.projectId);
      expect(data).toHaveProperty('name', mockProjectDetails.name);
    });
  });

  // Test archive_project tool
  describe('archive_project', () => {
    it('should archive a project successfully using mocks', async () => {
      // Mock the API call
      const mockResponse = { result: 'success' };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/archive`, 200, mockResponse);

      // Call the tool handler
      const result = await tools.archive_project.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response indicates success
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when archiving a project', async () => {
      // Mock the API call with error response
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/archive`, 404, {
        error: 'Not Found',
        message: 'Project not found'
      });

      // Call the tool handler
      const result = await tools.archive_project.handler({ projectId: TEST_DATA.projectId });

      // Check that the result is an error
      expect(result.isError).toBe(true);

      // Parse the error data
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test activate_project tool
  describe('activate_project', () => {
    it('should activate a project successfully using mocks', async () => {
      // Mock the API call
      const mockResponse = { result: 'success' };
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/activate`, 200, mockResponse);

      // Call the tool handler
      const result = await tools.activate_project.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response indicates success
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when activating a project', async () => {
      // Mock the API call with error response
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/activate`, 404, {
        error: 'Not Found',
        message: 'Project not found'
      });

      // Call the tool handler
      const result = await tools.activate_project.handler({ projectId: TEST_DATA.projectId });

      // Check that the result is an error
      expect(result.isError).toBe(true);

      // Parse the error data
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test delete_project tool
  describe('delete_project', () => {
    it('should delete a project successfully using mocks', async () => {
      // Mock the API call
      const mockResponse = { result: 'success' };
      mockFreeloApi('DELETE', `/project/${TEST_DATA.projectId}`, 200, mockResponse);

      // Call the tool handler
      const result = await tools.delete_project.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response indicates success
      expect(data).toHaveProperty('result', 'success');
    });

    it('should handle errors when deleting a project', async () => {
      // Mock the API call with error response
      mockFreeloApi('DELETE', `/project/${TEST_DATA.projectId}`, 404, {
        error: 'Not Found',
        message: 'Project not found'
      });

      // Call the tool handler
      const result = await tools.delete_project.handler({ projectId: TEST_DATA.projectId });

      // Check that the result is an error
      expect(result.isError).toBe(true);

      // Parse the error data
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    });
  });

  // Test get_all_tasks tool
  describe('get_all_tasks', () => {
    it('should return all tasks successfully using mocks', async () => {
      // Mock the API call
      const mockTasks = [{ id: TEST_DATA.taskId, name: 'Mock Task 1' }];
      mockFreeloApi('GET', '/all-tasks', 200, mockTasks);

      // Call the tool handler
      const result = await tools.get_all_tasks.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains tasks
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test get_tasklist_tasks tool
  describe('get_tasklist_tasks', () => {
    it('should return tasklist tasks successfully using mocks', async () => {
      // Mock the API call
      const mockTasks = [{ id: TEST_DATA.taskId, name: 'Mock Tasklist Task 1' }];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/tasklist/${TEST_DATA.tasklistId}/tasks`, 200, mockTasks);

      // Call the tool handler
      const result = await tools.get_tasklist_tasks.handler({
        projectId: TEST_DATA.projectId,
        tasklistId: TEST_DATA.tasklistId
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains tasks
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });

    it('should handle ordering parameters correctly', async () => {
      // Mock the API call with ordering parameters
      const mockTasks = [{ id: TEST_DATA.taskId, name: 'Mock Ordered Task' }];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/tasklist/${TEST_DATA.tasklistId}/tasks`, 200, mockTasks);

      // Call the tool handler with ordering parameters
      const result = await tools.get_tasklist_tasks.handler({
        projectId: TEST_DATA.projectId,
        tasklistId: TEST_DATA.tasklistId,
        orderBy: 'name',
        order: 'desc'
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains tasks
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test get_task_details tool
  describe('get_task_details', () => {
    it('should return task details successfully using mocks', async () => {
      // Mock the API call
      const mockTaskDetails = { id: TEST_DATA.taskId, name: 'Mock Task Details', tasklist_id: TEST_DATA.tasklistId };
      mockFreeloApi('GET', `/task/${TEST_DATA.taskId}`, 200, mockTaskDetails);

      // Call the tool handler
      const result = await tools.get_task_details.handler({ taskId: TEST_DATA.taskId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains task details
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
      expect(data).toHaveProperty('name', mockTaskDetails.name);
    });
  });

  // Test get_project_tasklists tool
  describe('get_project_tasklists', () => {
    it('should return project tasklists successfully using mocks', async () => {
      // Mock the API call
      const mockTasklists = [{ id: TEST_DATA.tasklistId, name: 'Mock Tasklist 1' }];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/tasklists`, 200, mockTasklists);

      // Call the tool handler
      const result = await tools.get_project_tasklists.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains tasklists
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test get_tasklist_details tool
  describe('get_tasklist_details', () => {
    it('should return tasklist details successfully using mocks', async () => {
      // Mock the API call
      const mockTasklistDetails = { id: TEST_DATA.tasklistId, name: 'Mock Tasklist Details', project_id: TEST_DATA.projectId };
      mockFreeloApi('GET', `/tasklist/${TEST_DATA.tasklistId}`, 200, mockTasklistDetails);

      // Call the tool handler
      const result = await tools.get_tasklist_details.handler({ tasklistId: TEST_DATA.tasklistId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains tasklist details
      expect(data).toHaveProperty('id', TEST_DATA.tasklistId);
      expect(data).toHaveProperty('name', mockTasklistDetails.name);
    });
  });

  // Test get_users tool
  describe('get_users', () => {
    it('should return users successfully using mocks', async () => {
      // Mock the API call
      const mockUsers = [{ id: TEST_DATA.userId, fullname: 'Mock User 1', email: 'mock@example.com' }];
      mockFreeloApi('GET', '/users', 200, mockUsers);

      // Call the tool handler
      const result = await tools.get_users.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains users
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('fullname');
      }
    });
  });

  // Test get_project_workers tool
  describe('get_project_workers', () => {
    it('should return project workers successfully using mocks', async () => {
      // Mock the API call
      const mockWorkers = [{ id: TEST_DATA.userId, fullname: 'Mock Worker 1', email: 'mock@example.com' }];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/workers`, 200, mockWorkers);

      // Call the tool handler
      const result = await tools.get_project_workers.handler({ projectId: TEST_DATA.projectId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains workers
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('fullname');
      }
    });
  });

  // Test get_all_files tool
  describe('get_all_files', () => {
    it('should return all files successfully using mocks', async () => {
      // Mock the API call
      const mockFiles = [{ id: 1, uuid: TEST_DATA.fileUuid, name: 'mock_file.txt', size: 1024 }];
      mockFreeloApi('GET', '/files', 200, mockFiles);

      // Call the tool handler
      const result = await tools.get_all_files.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains files
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });
  });

  // Test get_subtasks tool
  describe('get_subtasks', () => {
    it('should return subtasks successfully using mocks', async () => {
      // Mock the API call
      const mockSubtasks = [{ id: TEST_DATA.subtaskId, name: 'Mock Subtask 1', labels: [{ uuid: TEST_DATA.labelId, name: 'Mock Label' }] }];
      mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/subtasks`, 200, mockSubtasks);

      // Call the tool handler
      const result = await tools.get_subtasks.handler({ taskId: TEST_DATA.taskId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains subtasks
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');

        // No need to store label ID dynamically, using mock TEST_DATA
        // if (data[0].labels && data[0].labels.length > 0) {
        //   TEST_DATA.labelId = data[0].labels[0].uuid;
        // }
      }
    });
  });

  // Test get_task_comments tool
  describe('get_task_comments', () => {
    it('should return task comments successfully using mocks', async () => {
      // Mock the API call
      const mockComments = [{ id: TEST_DATA.commentId, content: 'Mock Comment 1' }];
      mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/comments`, 200, mockComments);

      // Call the tool handler
      const result = await tools.get_task_comments.handler({ taskId: TEST_DATA.taskId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains comments
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('content');
      }
    });
  });

  // Test get_task_labels tool
  describe('get_task_labels', () => {
    it('should return task labels successfully using mocks', async () => {
      // Mock the API call
      const mockLabels = [{ uuid: TEST_DATA.labelId, name: 'Mock Label 1', color: '#ff0000' }];
      mockFreeloApi('GET', '/task-labels', 200, mockLabels);

      // Call the tool handler
      const result = await tools.get_task_labels.handler({});

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains labels
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('uuid');
        expect(data[0]).toHaveProperty('name');

        // No need to store label ID dynamically, using mock TEST_DATA
        // if (!TEST_DATA.labelId) {
        //   TEST_DATA.labelId = data[0].uuid;
        // }
      }
    });
  });

  // Test get_time_estimates tool
  describe('get_time_estimates', () => {
    it('should return time estimates successfully using mocks', async () => {
      // Mock the API call
      const mockTimeEstimates = { total: { hours: 5, minutes: 30 }, users: [{ user_id: TEST_DATA.userId, hours: 2, minutes: 0 }] };
      mockFreeloApi('GET', `/task/${TEST_DATA.taskId}/time-estimates`, 200, mockTimeEstimates);

      // Call the tool handler
      const result = await tools.get_time_estimates.handler({ taskId: TEST_DATA.taskId });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains time estimates
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('users');
    });
  });

  // Test edit_task tool
  describe('edit_task', () => {
    it('should edit a task successfully using mocks', async () => {
      // Edit task data
      const taskName = `Edited Test Task ${randomString(5)}`;
      const taskData = {
        name: taskName,
        description: 'This is an edited test task'
      };

      // Mock the API call (match request body)
      const mockEditedTask = { ...taskData, id: TEST_DATA.taskId };
      mockFreeloApi('POST', `/task/${TEST_DATA.taskId}`, 200, mockEditedTask, taskData);

      // Call the tool handler
      const result = await tools.edit_task.handler({
        taskId: TEST_DATA.taskId,
        taskData
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains the edited task
      expect(data).toHaveProperty('id', TEST_DATA.taskId);
      expect(data).toHaveProperty('name', taskName);
    });
  });

  // Test edit_subtask tool
  describe('edit_subtask', () => {
    it('should edit a subtask successfully using mocks', async () => {
      // Edit subtask data
      const subtaskName = `Edited Test Subtask ${randomString(5)}`;
      const subtaskData = {
        name: subtaskName
      };

      // Mock the API call (match request body)
      const mockEditedSubtask = { ...subtaskData, id: TEST_DATA.subtaskId };
      mockFreeloApi('POST', `/subtask/${TEST_DATA.subtaskId}`, 200, mockEditedSubtask, subtaskData);

      // Call the tool handler
      const result = await tools.edit_subtask.handler({
        subtaskId: TEST_DATA.subtaskId,
        subtaskData
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains the edited subtask
      expect(data).toHaveProperty('id', TEST_DATA.subtaskId);
      expect(data).toHaveProperty('name', subtaskName);
    });
  });

  // Test edit_comment tool
  describe('edit_comment', () => {
    it('should edit a comment successfully using mocks', async () => {
      // Edit comment data
      const commentContent = `Edited Test Comment ${randomString(5)}`;
      const commentData = {
        content: commentContent
      };

      // Mock the API call (match request body)
      const mockEditedComment = { ...commentData, id: TEST_DATA.commentId };
      mockFreeloApi('POST', `/comment/${TEST_DATA.commentId}`, 200, mockEditedComment, commentData);

      // Call the tool handler
      const result = await tools.edit_comment.handler({
        commentId: TEST_DATA.commentId,
        commentData
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains the edited comment
      expect(data).toHaveProperty('id', TEST_DATA.commentId);
      expect(data).toHaveProperty('content', commentContent);
    });
  });

  // Test create/modify/delete workflow using mocks
  describe('create_task and related actions', () => {
    // Define mock IDs used throughout this workflow
    const mockCreatedTaskId = TEST_DATA.taskId + '-workflow';
    const mockCreatedSubtaskId = TEST_DATA.subtaskId + '-workflow';
    const mockCreatedCommentId = TEST_DATA.commentId + '-workflow';

    it('should handle task creation, modification, and deletion using mocks', async () => {
      // --- 1. Create Task ---
      const taskName = `Workflow Task ${randomString(5)}`;
      const taskDueDate = dateString(7);
      const taskData = { name: taskName, description: 'Workflow test task', due_date: taskDueDate };
      const mockCreatedTask = { ...taskData, id: mockCreatedTaskId, tasklist_id: TEST_DATA.tasklistId };
      mockFreeloApi('POST', `/tasklist/${TEST_DATA.tasklistId}/task`, 200, mockCreatedTask, taskData);

      const createTaskResult = await tools.create_task.handler({ tasklistId: TEST_DATA.tasklistId, taskData });
      expect(isValidResponse(createTaskResult)).toBe(true);
      const createdTaskData = getResponseData(createTaskResult);
      expect(createdTaskData).toHaveProperty('id', mockCreatedTaskId);
      expect(createdTaskData).toHaveProperty('name', taskName);

      // --- 2. Create Subtask ---
      const subtaskName = `Workflow Subtask ${randomString(5)}`;
      const subtaskDueDate = dateString(5);
      const subtaskData = { name: subtaskName, due_date: subtaskDueDate };
      const mockCreatedSubtask = { ...subtaskData, id: mockCreatedSubtaskId, task_id: mockCreatedTaskId };
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/subtask`, 200, mockCreatedSubtask, subtaskData);

      const createSubtaskResult = await tools.create_subtask.handler({ taskId: mockCreatedTaskId, subtaskData });
      expect(isValidResponse(createSubtaskResult)).toBe(true);
      const createdSubtaskData = getResponseData(createSubtaskResult);
      expect(createdSubtaskData).toHaveProperty('id', mockCreatedSubtaskId);
      expect(createdSubtaskData).toHaveProperty('name', subtaskName);

      // --- 3. Create Comment ---
      const commentText = `Workflow Comment ${randomString(5)}`;
      const commentData = { text: commentText };
      const mockCreatedComment = { id: mockCreatedCommentId, content: commentText, task_id: mockCreatedTaskId };
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/comments`, 200, mockCreatedComment, commentData);

      const createCommentResult = await tools.create_comment.handler({ taskId: mockCreatedTaskId, commentData });
      expect(isValidResponse(createCommentResult)).toBe(true);
      const createdCommentData = getResponseData(createCommentResult);
      expect(createdCommentData).toHaveProperty('id', mockCreatedCommentId);
      expect(createdCommentData).toHaveProperty('content', commentText);

      // --- 4. Add Labels ---
      const labelUuids = [TEST_DATA.labelId];
      mockFreeloApi('POST', `/task-labels/add-to-task/${mockCreatedTaskId}`, 200, { status: 'success' }, { labels: [{ uuid: TEST_DATA.labelId }] });
      const addLabelsResult = await tools.add_labels_to_task.handler({ taskId: mockCreatedTaskId, labelUuids });
      expect(isValidResponse(addLabelsResult)).toBe(true);
      expect(getResponseData(addLabelsResult)).toHaveProperty('status', 'success');

      // --- 5. Remove Labels ---
      mockFreeloApi('POST', `/task-labels/remove-from-task/${mockCreatedTaskId}`, 200, { status: 'success' }, { labels: [{ uuid: TEST_DATA.labelId }] });
      const removeLabelsResult = await tools.remove_labels_from_task.handler({ taskId: mockCreatedTaskId, labelUuids });
      expect(isValidResponse(removeLabelsResult)).toBe(true);
      expect(getResponseData(removeLabelsResult)).toHaveProperty('status', 'success');

      // --- 6. Create Total Time Estimate ---
      const totalTimeEstimateData = { hours: 2, minutes: 30 };
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/total-time-estimate`, 200, { status: 'success' }, totalTimeEstimateData);
      const createTotalTimeResult = await tools.create_total_time_estimate.handler({ taskId: mockCreatedTaskId, ...totalTimeEstimateData });
      expect(isValidResponse(createTotalTimeResult)).toBe(true);
      expect(getResponseData(createTotalTimeResult)).toHaveProperty('status', 'success');

      // --- 7. Create User Time Estimate ---
      // Mock the necessary worker fetch first
      const mockWorkers = [{ id: TEST_DATA.userId, fullname: 'Mock Worker Workflow' }];
      mockFreeloApi('GET', `/project/${TEST_DATA.projectId}/workers`, 200, mockWorkers);
      // Now mock the user time estimate creation
      const userTimeEstimateData = { user_id: TEST_DATA.userId, hours: 1, minutes: 45 };
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/user-time-estimate`, 200, { status: 'success' }, userTimeEstimateData);
      const createUserTimeResult = await tools.create_user_time_estimate.handler({
        taskId: mockCreatedTaskId,
        userId: TEST_DATA.userId, // Use the mock user ID
        hours: userTimeEstimateData.hours,
        minutes: userTimeEstimateData.minutes
      });
      expect(isValidResponse(createUserTimeResult)).toBe(true);
      expect(getResponseData(createUserTimeResult)).toHaveProperty('status', 'success');

      // --- 8. Finish Task ---
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/finish`, 200, { status: 'success' });
      const finishTaskResult = await tools.finish_task.handler({ taskId: mockCreatedTaskId });
      expect(isValidResponse(finishTaskResult)).toBe(true);
      expect(getResponseData(finishTaskResult)).toHaveProperty('status', 'success');

      // --- 9. Activate Task ---
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/activate`, 200, { status: 'success' });
      const activateTaskResult = await tools.activate_task.handler({ taskId: mockCreatedTaskId });
      expect(isValidResponse(activateTaskResult)).toBe(true);
      expect(getResponseData(activateTaskResult)).toHaveProperty('status', 'success');

      // --- 10. Move Task ---
      mockFreeloApi('POST', `/task/${mockCreatedTaskId}/move/${TEST_DATA.tasklistId}`, 200, { status: 'success' });
      const moveTaskResult = await tools.move_task.handler({ taskId: mockCreatedTaskId, tasklistId: TEST_DATA.tasklistId });
      expect(isValidResponse(moveTaskResult)).toBe(true);
      expect(getResponseData(moveTaskResult)).toHaveProperty('status', 'success');

      // --- Cleanup ---

      // --- 11. Delete Subtask ---
      mockFreeloApi('DELETE', `/subtask/${mockCreatedSubtaskId}`, 200, { status: 'success' });
      const deleteSubtaskResult = await tools.delete_subtask.handler({ subtaskId: mockCreatedSubtaskId });
      expect(isValidResponse(deleteSubtaskResult)).toBe(true);
      expect(getResponseData(deleteSubtaskResult)).toHaveProperty('status', 'success');

      // --- 12. Delete Comment ---
      mockFreeloApi('DELETE', `/comment/${mockCreatedCommentId}`, 200, { status: 'success' });
      const deleteCommentResult = await tools.delete_comment.handler({ commentId: mockCreatedCommentId });
      expect(isValidResponse(deleteCommentResult)).toBe(true);
      expect(getResponseData(deleteCommentResult)).toHaveProperty('status', 'success');

      // --- 13. Delete Task ---
      mockFreeloApi('DELETE', `/task/${mockCreatedTaskId}`, 200, { status: 'success' });
      const deleteTaskResult = await tools.delete_task.handler({ taskId: mockCreatedTaskId });
      expect(isValidResponse(deleteTaskResult)).toBe(true);
      expect(getResponseData(deleteTaskResult)).toHaveProperty('status', 'success');
    });
  });

  // Test create_tasklist tool
  describe('create_tasklist', () => {
    it('should create a tasklist successfully using mocks', async () => {
      // Create tasklist data
      const tasklistName = `Test Tasklist ${randomString(5)}`;
      const tasklistData = {
        name: tasklistName,
        project_id: TEST_DATA.projectId // This field is actually part of the data, not just the URL param
      };
      const mockCreatedTasklist = { ...tasklistData, id: TEST_DATA.tasklistId + '-new' };

      // Mock the API call (match request body)
      // Note: The API endpoint uses projectId in the URL, but the payload also contains project_id
      mockFreeloApi('POST', `/project/${TEST_DATA.projectId}/tasklist`, 200, mockCreatedTasklist, tasklistData);

      // Call the tool handler
      const result = await tools.create_tasklist.handler({
        projectId: TEST_DATA.projectId, // This is used for the URL
        tasklistData // This is the request body
      });

      // Check the result
      expect(isValidResponse(result)).toBe(true);

      // Parse the response data
      const data = getResponseData(result);

      // Check that the response contains the created tasklist
      expect(data).toHaveProperty('id', mockCreatedTasklist.id);
      expect(data).toHaveProperty('name', tasklistName);
    });
  });

  // Test upload_file and download_file tools
  describe('upload_file and download_file', () => {
    it('should handle file upload and download using mocks', async () => {
      // --- Mock Upload File ---
      const fileContent = `Test file content ${randomString(10)}`;
      const fileData = Buffer.from(fileContent).toString('base64');
      const fileName = `test-file-${randomString(5)}.txt`;
      const mockFileUuid = TEST_DATA.fileUuid + '-upload'; // Use a distinct mock UUID
      const mockUploadResponse = { uuid: mockFileUuid, name: fileName, size: fileContent.length };

      // Mock the POST /files endpoint. Nock handles multipart/form-data matching loosely by default.
      // We don't need to specify the exact multipart body for this mock.
      mockFreeloApi('POST', '/files', 200, mockUploadResponse);

      // Call the upload_file tool handler
      const uploadResult = await tools.upload_file.handler({
        fileData,
        fileName
      });

      // Check the upload result
      expect(isValidResponse(uploadResult)).toBe(true);
      const uploadData = getResponseData(uploadResult);
      expect(uploadData).toHaveProperty('uuid', mockFileUuid);

      // --- Mock Download File ---
      const mockDownloadResponse = {
        data: fileData, // Return the same base64 data
        contentType: 'text/plain'
      };
      // Assuming the download endpoint is /file/{uuid}/download
      mockFreeloApi('GET', `/file/${mockFileUuid}/download`, 200, mockDownloadResponse);

      // Call the download_file tool handler
      const downloadResult = await tools.download_file.handler({
        fileUuid: mockFileUuid // Use the mock UUID from upload response
      });

      // Check the result
      expect(isValidResponse(downloadResult)).toBe(true);

      // Parse the response data
      const downloadData = getResponseData(downloadResult);

      // Check that the response contains the downloaded file data
      expect(downloadData).toHaveProperty('data');
      expect(downloadData).toHaveProperty('contentType');

      // Decode the base64 data and check the content matches the original
      const decodedContent = Buffer.from(downloadData.data, 'base64').toString('utf-8');
      expect(decodedContent).toBe(fileContent);
      expect(downloadData.contentType).toBe('text/plain');
    });
  });
});
