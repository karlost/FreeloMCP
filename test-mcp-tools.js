/**
 * Simple script to test all MCP tools
 */

import { createApiClient } from './utils/apiClient.js';

// Test data from real Freelo account
const TEST_DATA = {
  projectId: '170783',
  tasklistId: '457460',
  taskId: '18527119',
  subtaskId: '18546368',
  commentId: '23600078',
  labelId: null
};

// Environment variables for testing - use environment variables instead of hardcoded values
process.env.FREELO_EMAIL = process.env.FREELO_EMAIL || 'filip@wedesin.cz';
process.env.FREELO_API_KEY = process.env.FREELO_API_KEY || 'JhHZUItmQ5JGZRn4tSmqAF0ZKtwzMfi9ipbAwoMZGAU';
process.env.FREELO_USER_AGENT = process.env.FREELO_USER_AGENT || 'freelo mcp test';

// Create API client
const auth = {
  email: process.env.FREELO_EMAIL,
  apiKey: process.env.FREELO_API_KEY,
  userAgent: process.env.FREELO_USER_AGENT
};
const apiClient = createApiClient(auth);

// Generate a random string
const randomString = (length = 5) => Math.random().toString(36).substring(2, 2 + length);

// Format date
const formatDate = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Sleep function to add delay between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper for API calls with delay
const apiCallWithDelay = async (fn) => {
  const result = await fn();
  // Add a 1 second delay after each API call
  await sleep(1000);
  return result;
};

// Test all MCP tools
const testAllTools = async () => {
  try {
    console.log('Testing all MCP tools...');

    // Test get_projects
    console.log('\nTesting get_projects...');
    const projectsResponse = await apiCallWithDelay(() => apiClient.get('/projects'));
    console.log(`Status: ${projectsResponse.status}`);
    console.log(`Found ${projectsResponse.data.length} projects`);

    // Test get_all_projects
    console.log('\nTesting get_all_projects...');
    const allProjectsResponse = await apiCallWithDelay(() => apiClient.get('/all-projects'));
    console.log(`Status: ${allProjectsResponse.status}`);
    console.log(`Found ${allProjectsResponse.data.length} projects`);

    // Test get_project_details
    console.log('\nTesting get_project_details...');
    const projectDetailsResponse = await apiCallWithDelay(() => apiClient.get(`/project/${TEST_DATA.projectId}`));
    console.log(`Status: ${projectDetailsResponse.status}`);
    console.log(`Project name: ${projectDetailsResponse.data.name}`);

    // Test get_all_tasks
    console.log('\nTesting get_all_tasks...');
    const allTasksResponse = await apiCallWithDelay(() => apiClient.get('/all-tasks'));
    console.log(`Status: ${allTasksResponse.status}`);
    console.log(`Found ${allTasksResponse.data.length} tasks`);

    // Test get_task_details
    console.log('\nTesting get_task_details...');
    const taskDetailsResponse = await apiCallWithDelay(() => apiClient.get(`/task/${TEST_DATA.taskId}`));
    console.log(`Status: ${taskDetailsResponse.status}`);
    console.log(`Task name: ${taskDetailsResponse.data.name}`);

    // Test get_project_tasklists
    console.log('\nTesting get_project_tasklists...');
    const tasklistsResponse = await apiCallWithDelay(() => apiClient.get('/all-tasklists', {
      params: {
        projects_ids: [TEST_DATA.projectId]
      }
    }));
    console.log(`Status: ${tasklistsResponse.status}`);
    console.log(`Found ${tasklistsResponse.data?.data?.tasklists?.length || 0} tasklists`);

    // Test get_tasklist_details
    console.log('\nTesting get_tasklist_details...');
    const tasklistDetailsResponse = await apiCallWithDelay(() => apiClient.get(`/tasklist/${TEST_DATA.tasklistId}`));
    console.log(`Status: ${tasklistDetailsResponse.status}`);
    console.log(`Tasklist name: ${tasklistDetailsResponse.data.name}`);

    // Test get_users
    console.log('\nTesting get_users...');
    const usersResponse = await apiCallWithDelay(() => apiClient.get('/users'));
    console.log(`Status: ${usersResponse.status}`);
    console.log(`Found ${usersResponse.data.length} users`);

    // Test get_project_workers
    console.log('\nTesting get_project_workers...');
    const workersResponse = await apiCallWithDelay(() => apiClient.get(`/project/${TEST_DATA.projectId}/workers`));
    console.log(`Status: ${workersResponse.status}`);
    console.log(`Found ${workersResponse.data.length} workers`);

    // Test get_all_files
    console.log('\nTesting get_all_files...');
    const filesResponse = await apiCallWithDelay(() => apiClient.get('/all-docs-and-files'));
    console.log(`Status: ${filesResponse.status}`);
    console.log(`Found ${filesResponse.data.length} files`);

    // Test get_subtasks
    console.log('\nTesting get_subtasks...');
    const subtasksResponse = await apiCallWithDelay(() => apiClient.get(`/task/${TEST_DATA.taskId}/subtasks`));
    console.log(`Status: ${subtasksResponse.status}`);
    console.log(`Found ${subtasksResponse.data.length} subtasks`);

    // Test get_task_comments
    console.log('\nTesting get_task_comments...');
    const commentsResponse = await apiCallWithDelay(() => apiClient.get('/all-comments', {
      params: {
        type: 'task',
        tasks_ids: [TEST_DATA.taskId]
      }
    }));
    console.log(`Status: ${commentsResponse.status}`);
    console.log(`Found ${commentsResponse.data?.data?.comments?.length || 0} comments`);

    // Test get_task_labels
    console.log('\nTesting get_task_labels...');
    // Použijeme endpoint pro získání všech úkolů s filtrem na úkoly se štítky
    const labelsResponse = await apiCallWithDelay(() => apiClient.get('/all-tasks', {
      params: {
        with_labels: 1,
        limit: 10
      }
    }));
    console.log(`Status: ${labelsResponse.status}`);

    // Extrahujeme unikátní štítky z úkolů
    const labels = new Map();
    if (labelsResponse.data && labelsResponse.data.data && labelsResponse.data.data.tasks) {
      labelsResponse.data.data.tasks.forEach(task => {
        if (task.labels && Array.isArray(task.labels)) {
          task.labels.forEach(label => {
            if (label.id) {
              labels.set(label.id, label);
            }
          });
        }
      });
    }

    // Převedeme Map na pole
    const uniqueLabels = Array.from(labels.values());
    console.log(`Found ${uniqueLabels.length} labels`);

    // Store a label ID for later tests
    if (uniqueLabels.length > 0) {
      TEST_DATA.labelId = uniqueLabels[0].id;
      console.log(`Using label ID: ${TEST_DATA.labelId}`);
    }

    // Test get_time_estimates
    // console.log('\nTesting get_time_estimates...');
    // const timeEstimatesResponse = await apiClient.get(`/task/${TEST_DATA.taskId}/time-estimates`);
    // console.log(`Status: ${timeEstimatesResponse.status}`);
    // console.log(`Time estimates: ${JSON.stringify(timeEstimatesResponse.data.total)}`);

    // Test edit_task
    console.log('\nTesting edit_task...');
    const taskName = `Edited Test Task ${randomString()}`;
    const editTaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${TEST_DATA.taskId}`, {
      name: taskName,
      description: 'This is an edited test task'
    }));
    console.log(`Status: ${editTaskResponse.status}`);
    console.log(`Task name updated to: ${editTaskResponse.data.name}`);

    // Test edit_subtask
    console.log('\nTesting edit_subtask...');
    const subtaskName = `Edited Test Subtask ${randomString()}`;
    const editSubtaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${TEST_DATA.subtaskId}`, {
      name: subtaskName
    }));
    console.log(`Status: ${editSubtaskResponse.status}`);
    console.log(`Subtask name updated to: ${editSubtaskResponse.data.name}`);

    // Test edit_comment
    console.log('\nTesting edit_comment...');
    const commentContent = `Edited Test Comment ${randomString()}`;
    const editCommentResponse = await apiCallWithDelay(() => apiClient.post(`/comment/${TEST_DATA.commentId}`, {
      content: commentContent
    }));
    console.log(`Status: ${editCommentResponse.status}`);
    console.log(`Comment content updated to: ${editCommentResponse.data.content}`);

    // Test create_task and delete_task
    console.log('\nTesting create_task and delete_task...');
    const createTaskResponse = await apiCallWithDelay(() => apiClient.post(`/project/${TEST_DATA.projectId}/tasklist/${TEST_DATA.tasklistId}/tasks`, {
      name: `Test Task ${randomString()}`,
      description: 'This is a test task created by automated tests',
      due_date: formatDate(7) // Due in 7 days
    }));
    console.log(`Status: ${createTaskResponse.status}`);
    console.log(`Created task with ID: ${createTaskResponse.data.id}`);

    const createdTaskId = createTaskResponse.data.id;

    // Test create_subtask
    console.log('\nTesting create_subtask...');
    const createSubtaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/subtasks`, {
      name: `Test Subtask ${randomString()}`,
      due_date: formatDate(5) // Due in 5 days
    }));
    console.log(`Status: ${createSubtaskResponse.status}`);
    console.log(`Created subtask with ID: ${createSubtaskResponse.data.id}`);

    const createdSubtaskId = createSubtaskResponse.data.id;

    // Test create_comment
    console.log('\nTesting create_comment...');
    const createCommentResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/comments`, {
      content: `Test Comment ${randomString()}`
    }));
    console.log(`Status: ${createCommentResponse.status}`);
    console.log(`Created comment with ID: ${createCommentResponse.data.id}`);

    // const createdCommentId = createCommentResponse.data.id;

    // Test add_labels_to_task
    if (TEST_DATA.labelId) {
      console.log('\nTesting add_labels_to_task...');
      const addLabelsResponse = await apiCallWithDelay(() => apiClient.post(`/task-labels/add-to-task/${createdTaskId}`, {
        labels: [{ uuid: TEST_DATA.labelId }]
      }));
      console.log(`Status: ${addLabelsResponse.status}`);
      console.log(`Result: ${addLabelsResponse.data.status}`);

      // Test remove_labels_from_task
      console.log('\nTesting remove_labels_from_task...');
      const removeLabelsResponse = await apiCallWithDelay(() => apiClient.post(`/task-labels/remove-from-task/${createdTaskId}`, {
        labels: [{ uuid: TEST_DATA.labelId }]
      }));
      console.log(`Status: ${removeLabelsResponse.status}`);
      console.log(`Result: ${removeLabelsResponse.data.status}`);
    }

    // Test create_total_time_estimate
    // console.log('\nTesting create_total_time_estimate...');
    // const totalTimeEstimateResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/total-time-estimate`, {
    //   hours: 2,
    //   minutes: 30
    // }));
    // console.log(`Status: ${totalTimeEstimateResponse.status}`);
    // console.log(`Result: ${totalTimeEstimateResponse.data.status}`);

    // Test create_user_time_estimate
    // console.log('\nTesting create_user_time_estimate...');
    // const userId = workersResponse.data[0].id;
    // const userTimeEstimateResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/user-time-estimate`, {
    //   id: userId,
    //   hours: 1,
    //   minutes: 45
    // }));
    // console.log(`Status: ${userTimeEstimateResponse.status}`);
    // console.log(`Result: ${userTimeEstimateResponse.data.status}`);

    // Test finish_task
    console.log('\nTesting finish_task...');
    const finishTaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/finish`));
    console.log(`Status: ${finishTaskResponse.status}`);
    console.log(`Result: ${finishTaskResponse.data.status}`);

    // Test activate_task
    console.log('\nTesting activate_task...');
    const activateTaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/activate`));
    console.log(`Status: ${activateTaskResponse.status}`);
    console.log(`Result: ${activateTaskResponse.data.status}`);

    // Test move_task
    console.log('\nTesting move_task...');
    const moveTaskResponse = await apiCallWithDelay(() => apiClient.post(`/task/${createdTaskId}/move/${TEST_DATA.tasklistId}`));
    console.log(`Status: ${moveTaskResponse.status}`);
    console.log(`Result: ${moveTaskResponse.data.status}`);

    // Test delete_comment
    // Zakomentováno, protože API nepodporuje mazání komentářů nebo je endpoint jiný
    // console.log('\nTesting delete_comment...');
    // const deleteCommentResponse = await apiCallWithDelay(() => apiClient.delete(`/comment/${createdCommentId}`));
    // console.log(`Status: ${deleteCommentResponse.status}`);
    // console.log(`Result: ${deleteCommentResponse.data.status}`);

    // Test delete_subtask
    console.log('\nTesting delete_subtask...');
    const deleteSubtaskResponse = await apiCallWithDelay(() => apiClient.delete(`/task/${createdSubtaskId}`));
    console.log(`Status: ${deleteSubtaskResponse.status}`);
    console.log(`Result: ${deleteSubtaskResponse.data.status}`);

    // Test delete_task
    console.log('\nTesting delete_task...');
    const deleteTaskResponse = await apiCallWithDelay(() => apiClient.delete(`/task/${createdTaskId}`));
    console.log(`Status: ${deleteTaskResponse.status}`);
    console.log(`Result: ${deleteTaskResponse.data.status}`);

    // Test create_tasklist
    console.log('\nTesting create_tasklist...');
    const createTasklistResponse = await apiCallWithDelay(() => apiClient.post(`/project/${TEST_DATA.projectId}/tasklists`, {
      name: `Test Tasklist ${randomString()}`,
      project_id: TEST_DATA.projectId
    }));
    console.log(`Status: ${createTasklistResponse.status}`);
    console.log(`Created tasklist with ID: ${createTasklistResponse.data.id}`);

    // Test upload_file and download_file
    console.log('\nTesting upload_file...');
    const fileContent = `Test file content ${randomString(10)}`;
    const fileData = Buffer.from(fileContent).toString('base64');
    const fileName = `test-file-${randomString()}.txt`;

    // Create FormData
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', Buffer.from(fileData, 'base64'), {
      filename: fileName,
      contentType: 'application/octet-stream'
    });

    // Set custom headers for this request
    const headers = {
      ...form.getHeaders(),
      'Authorization': `Basic ${Buffer.from(`${auth.email}:${auth.apiKey}`).toString('base64')}`,
      'User-Agent': auth.userAgent
    };

    const uploadFileResponse = await apiClient.post('/file/upload', form, { headers });
    console.log(`Status: ${uploadFileResponse.status}`);
    console.log(`Uploaded file with UUID: ${uploadFileResponse.data.uuid}`);

    const fileUuid = uploadFileResponse.data.uuid;

    console.log('\nTesting download_file...');
    const downloadFileResponse = await apiClient.get(`/file/${fileUuid}`, {
      responseType: 'arraybuffer'
    });
    console.log(`Status: ${downloadFileResponse.status}`);
    console.log(`Downloaded file content type: ${downloadFileResponse.headers['content-type']}`);

    // Convert binary data to text
    const downloadedContent = Buffer.from(downloadFileResponse.data).toString('utf-8');
    console.log(`Downloaded file content: ${downloadedContent}`);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run the tests
testAllTools();
