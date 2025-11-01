import { Request, Response, NextFunction } from 'express';
import {
  Employee,
  Department,
  Shift,
  LeaveRequest,
  Attendance,
  JobPost,
  Holiday,
  User,
} from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// ===== Employee Management =====

// GET /v1/admin/hr/employees - List all employees
export const listEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, shiftId, isActive, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (shiftId) where.shiftId = shiftId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'name', 'startTime', 'endTime'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/hr/employees/:id - Get employee details
export const getEmployeeDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'isActive'],
        },
        {
          model: Department,
          as: 'department',
        },
        {
          model: Shift,
          as: 'shift',
        },
      ],
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/employees - Create employee
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      departmentId,
      shiftId,
      employeeCode,
      designation,
      joiningDate,
      salary,
      bankDetails,
      documents,
    } = req.body;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify department exists
    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        throw new AppError('Department not found', 404);
      }
    }

    // Verify shift exists
    if (shiftId) {
      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        throw new AppError('Shift not found', 404);
      }
    }

    // Check if employee already exists for this user
    const existingEmployee = await Employee.findOne({ where: { userId } });
    if (existingEmployee) {
      throw new AppError('Employee record already exists for this user', 400);
    }

    const employee = await Employee.create({
      userId,
      departmentId,
      shiftId,
      employeeCode,
      designation,
      joiningDate: joiningDate || new Date(),
      salary,
      bankDetails: bankDetails || {},
      documents: documents || {},
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/hr/employees/:id - Update employee
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== 'id' && key !== 'userId') {
        (employee as any)[key] = updateData[key];
      }
    });

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/admin/hr/employees/:id - Delete employee
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Soft delete by marking as inactive
    employee.isActive = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ===== Department Management =====

// GET /v1/admin/hr/departments - List all departments
export const listDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await Department.findAll({
      order: [['name', 'ASC']],
    });

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.count({ where: { departmentId: dept.id } });
        return {
          ...dept.toJSON(),
          employeeCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { departments: departmentsWithCount },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/departments - Create department
export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    const department = await Department.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/hr/departments/:id - Update department
export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    if (name !== undefined) department.name = name;
    if (description !== undefined) department.description = description;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
};

// ===== Shift Management =====

// GET /v1/admin/hr/shifts - List all shifts
export const listShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shifts = await Shift.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: { shifts },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/shifts - Create shift
export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, startTime, endTime, days } = req.body;

    const shift = await Shift.create({
      name,
      startTime,
      endTime,
      days: days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/hr/shifts/:id - Update shift
export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, days } = req.body;

    const shift = await Shift.findByPk(id);
    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    if (name !== undefined) shift.name = name;
    if (startTime !== undefined) shift.startTime = startTime;
    if (endTime !== undefined) shift.endTime = endTime;
    if (days !== undefined) shift.days = days;

    await shift.save();

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
};

// ===== Leave Management =====

// GET /v1/admin/hr/leaves - List leave requests
export const listLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: leaves } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        leaves,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/hr/leaves/:id/approve - Approve leave
export const approveLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { approvalComments } = req.body;

    const leave = await LeaveRequest.findByPk(id);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    if (leave.status !== 'pending') {
      throw new AppError('Leave request has already been processed', 400);
    }

    leave.status = 'approved';
    leave.approvedBy = req.user?.id;
    leave.approvedAt = new Date();
    leave.approvalComments = approvalComments;

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/hr/leaves/:id/reject - Reject leave
export const rejectLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { approvalComments } = req.body;

    const leave = await LeaveRequest.findByPk(id);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    if (leave.status !== 'pending') {
      throw new AppError('Leave request has already been processed', 400);
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user?.id;
    leave.approvedAt = new Date();
    leave.approvalComments = approvalComments;

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// ===== Attendance Management =====

// GET /v1/admin/hr/attendance - View attendance records
export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name'],
            },
          ],
        },
      ],
      order: [['date', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        attendance,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/attendance - Mark attendance
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, notes } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      where: { employeeId, date: new Date(date) },
    });

    if (existingAttendance) {
      throw new AppError('Attendance already marked for this date', 400);
    }

    const attendance = await Attendance.create({
      employeeId,
      date: new Date(date),
      status,
      checkInTime,
      checkOutTime,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// ===== Job Posts =====

// GET /v1/admin/hr/jobs - List job posts
export const listJobPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: jobs } = await JobPost.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/jobs - Create job post
export const createJobPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      departmentId,
      location,
      jobType,
      description,
      requirements,
      salaryMin,
      salaryMax,
      vacancies,
    } = req.body;

    const job = await JobPost.create({
      title,
      departmentId,
      location,
      jobType,
      description,
      requirements: requirements || [],
      salaryMin,
      salaryMax,
      vacancies: vacancies || 1,
      status: 'open',
      postedBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Job post created successfully',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/hr/jobs/:id/close - Close job post
export const closeJobPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const job = await JobPost.findByPk(id);
    if (!job) {
      throw new AppError('Job post not found', 404);
    }

    job.status = 'closed';
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job post closed successfully',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

// ===== Holidays =====

// GET /v1/admin/hr/holidays - List holidays
export const listHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query;

    const where: any = {};
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.date = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    const holidays = await Holiday.findAll({
      where,
      order: [['date', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: { holidays },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/hr/holidays - Create holiday
export const createHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, date, isOptional, description } = req.body;

    const holiday = await Holiday.create({
      name,
      date: new Date(date),
      isOptional: isOptional || false,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: { holiday },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/admin/hr/holidays/:id - Delete holiday
export const deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findByPk(id);
    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    await holiday.destroy();

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
