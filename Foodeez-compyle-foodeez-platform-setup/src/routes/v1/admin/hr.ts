import { Router } from 'express';
import {
  listEmployees,
  getEmployeeDetails,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listDepartments,
  createDepartment,
  updateDepartment,
  listShifts,
  createShift,
  updateShift,
  listLeaveRequests,
  approveLeave,
  rejectLeave,
  getAttendanceRecords,
  markAttendance,
  listJobPosts,
  createJobPost,
  closeJobPost,
  listHolidays,
  createHoliday,
  deleteHoliday,
} from '@/controllers/admin/hrAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication with HR or super admin role
router.use(authenticate, authorize(['super_admin', 'hr', 'manager']));

// ===== Employee Routes =====

router.get(
  '/employees',
  [
    query('departmentId').optional().isUUID(),
    query('shiftId').optional().isUUID(),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listEmployees
);

router.get('/employees/:id', [param('id').isUUID(), validate], getEmployeeDetails);

router.post(
  '/employees',
  authorize(['super_admin', 'hr']),
  [
    body('userId').isUUID(),
    body('departmentId').optional().isUUID(),
    body('shiftId').optional().isUUID(),
    body('employeeCode').isString().trim().isLength({ min: 2, max: 50 }),
    body('designation').isString().trim().isLength({ min: 2, max: 100 }),
    body('joiningDate').optional().isISO8601(),
    body('salary').optional().isFloat({ min: 0 }),
    body('bankDetails').optional().isObject(),
    body('documents').optional().isObject(),
    validate,
  ],
  createEmployee
);

router.put(
  '/employees/:id',
  authorize(['super_admin', 'hr']),
  [param('id').isUUID(), validate],
  updateEmployee
);

router.delete(
  '/employees/:id',
  authorize(['super_admin', 'hr']),
  [param('id').isUUID(), validate],
  deleteEmployee
);

// ===== Department Routes =====

router.get('/departments', listDepartments);

router.post(
  '/departments',
  authorize(['super_admin', 'hr']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  createDepartment
);

router.put(
  '/departments/:id',
  authorize(['super_admin', 'hr']),
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updateDepartment
);

// ===== Shift Routes =====

router.get('/shifts', listShifts);

router.post(
  '/shifts',
  authorize(['super_admin', 'hr']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 50 }),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('days').optional().isArray(),
    body('days.*').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    validate,
  ],
  createShift
);

router.put(
  '/shifts/:id',
  authorize(['super_admin', 'hr']),
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('days').optional().isArray(),
    validate,
  ],
  updateShift
);

// ===== Leave Routes =====

router.get(
  '/leaves',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('employeeId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listLeaveRequests
);

router.patch(
  '/leaves/:id/approve',
  authorize(['super_admin', 'hr', 'manager']),
  [
    param('id').isUUID(),
    body('approvalComments').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  approveLeave
);

router.patch(
  '/leaves/:id/reject',
  authorize(['super_admin', 'hr', 'manager']),
  [
    param('id').isUUID(),
    body('approvalComments').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  rejectLeave
);

// ===== Attendance Routes =====

router.get(
  '/attendance',
  [
    query('employeeId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getAttendanceRecords
);

router.post(
  '/attendance',
  authorize(['super_admin', 'hr']),
  [
    body('employeeId').isUUID(),
    body('date').isISO8601(),
    body('status').isIn(['present', 'absent', 'half_day']),
    body('checkInTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('checkOutTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  markAttendance
);

// ===== Job Post Routes =====

router.get(
  '/jobs',
  [
    query('status').optional().isIn(['open', 'closed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listJobPosts
);

router.post(
  '/jobs',
  authorize(['super_admin', 'hr']),
  [
    body('title').isString().trim().isLength({ min: 2, max: 200 }),
    body('departmentId').optional().isUUID(),
    body('location').isString().trim().isLength({ min: 2, max: 200 }),
    body('jobType').isIn(['full_time', 'part_time', 'contract', 'internship']),
    body('description').isString().trim().isLength({ min: 10 }),
    body('requirements').optional().isArray(),
    body('salaryMin').optional().isFloat({ min: 0 }),
    body('salaryMax').optional().isFloat({ min: 0 }),
    body('vacancies').optional().isInt({ min: 1 }),
    validate,
  ],
  createJobPost
);

router.patch(
  '/jobs/:id/close',
  authorize(['super_admin', 'hr']),
  [param('id').isUUID(), validate],
  closeJobPost
);

// ===== Holiday Routes =====

router.get(
  '/holidays',
  [query('year').optional().isInt({ min: 2020, max: 2100 }), validate],
  listHolidays
);

router.post(
  '/holidays',
  authorize(['super_admin', 'hr']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 200 }),
    body('date').isISO8601(),
    body('isOptional').optional().isBoolean(),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  createHoliday
);

router.delete(
  '/holidays/:id',
  authorize(['super_admin', 'hr']),
  [param('id').isUUID(), validate],
  deleteHoliday
);

export default router;
