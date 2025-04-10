import express from 'express';
const router = express.Router();

// Import route modules
import projectsRoutes from './projects.js';
import pinnedItemsRoutes from './pinnedItems.js';
import tasklistsRoutes from './tasklists.js';
import tasksRoutes from './tasks.js';
import subtasksRoutes from './subtasks.js';
import taskLabelsRoutes from './taskLabels.js';
import commentsRoutes from './comments.js';
import timeTrackingRoutes from './timeTracking.js';
import workReportsRoutes from './workReports.js';
import invoicingRoutes from './invoicing.js';
import usersRoutes from './users.js';
import notificationsRoutes from './notifications.js';
import eventsRoutes from './events.js';
import filesRoutes from './files.js';
import statesRoutes from './states.js';
import customFieldsRoutes from './customFields.js';
import customFiltersRoutes from './customFilters.js';
import notesRoutes from './notes.js';
import searchRoutes from './search.js';
// We'll add more routes as we implement them

// Register routes
router.use('/', projectsRoutes);
router.use('/', pinnedItemsRoutes);
router.use('/', tasklistsRoutes);
router.use('/', tasksRoutes);
router.use('/', subtasksRoutes);
router.use('/', taskLabelsRoutes);
router.use('/', commentsRoutes);
router.use('/', timeTrackingRoutes);
router.use('/', workReportsRoutes);
router.use('/', invoicingRoutes);
router.use('/', usersRoutes);
router.use('/', notificationsRoutes);
router.use('/', eventsRoutes);
router.use('/', filesRoutes);
router.use('/', statesRoutes);
router.use('/', customFieldsRoutes);
router.use('/', customFiltersRoutes);
router.use('/', notesRoutes);
router.use('/', searchRoutes);
// We'll add more route registrations as we implement them

module.exports = router;
