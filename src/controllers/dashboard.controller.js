import { Assignment, Note, PYQ, Notice, Subject } from '../models/index.js';

export const getFacultyDashboard = async (request, reply) => {
  try {
    const faculty = request.user;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Get subjects taught by faculty
    const subjects = await Subject.find({ subjectFaculty: faculty._id })
      .populate('course', 'courseName');

    // Get recent assignments
    const recentAssignments = await Assignment.find({
      subject: { $in: subjects.map(s => s._id) },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(5);

    // Get pending submissions
    const pendingSubmissions = await Assignment.aggregate([
      {
        $match: {
          subject: { $in: subjects.map(s => s._id) },
          dueDate: { $gte: new Date() }
        }
      },
      {
        $project: {
          title: 1,
          dueDate: 1,
          totalStudents: { $size: "$submissions" }
        }
      }
    ]);

    // Get upload statistics
    const stats = await Promise.all([
      Note.countDocuments({ uploadedBy: faculty._id }),
      PYQ.countDocuments({ uploadedBy: faculty._id }),
      Assignment.countDocuments({ uploadedBy: faculty._id })
    ]);

    return reply.code(200).send({
      success: true,
      dashboard: {
        subjects,
        recentAssignments,
        pendingSubmissions,
        stats: {
          totalNotes: stats[0],
          totalPYQs: stats[1],
          totalAssignments: stats[2]
        }
      }
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const getStudentDashboard = async (request, reply) => {
  try {
    const student = request.user;
    const today = new Date();

    // Get current subjects
    const subjects = await Subject.find({
      course: student.course,
      semester: student.semester
    }).populate('subjectFaculty', 'name');

    // Get pending assignments
    const pendingAssignments = await Assignment.find({
      subject: { $in: subjects.map(s => s._id) },
      dueDate: { $gte: today },
      'submissions.student': { $ne: student._id }
    }).sort({ dueDate: 1 });

    // Get recent notices
    const recentNotices = await Notice.find({
      'targetAudience': {
        $elemMatch: {
          course: student.course,
          semester: student.semester
        }
      },
      expiresAt: { $gt: today }
    }).sort({ priority: -1, createdAt: -1 }).limit(5);

    // Get recent uploads
    const recentUploads = await Promise.all([
      Note.find({ subject: { $in: subjects.map(s => s._id) } })
        .sort({ createdAt: -1 })
        .limit(3),
      PYQ.find({ subject: { $in: subjects.map(s => s._id) } })
        .sort({ createdAt: -1 })
        .limit(3)
    ]);

    return reply.code(200).send({
      success: true,
      dashboard: {
        subjects,
        pendingAssignments,
        recentNotices,
        recentUploads: {
          notes: recentUploads[0],
          pyqs: recentUploads[1]
        }
      }
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};