import { Assignment } from '../models/assignment.model.js';
import { Subject } from '../models/subject.model.js';
import { Student } from '../models/user.model.js';
import { deleteFile } from '../utils/cloudinaryConfig.js';
import { createNotification } from './notification.controller.js';

export const uploadAssignment = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, description, dueDate, subjectId } = request.body;
    
    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      subjectFaculty: faculty._id,
    });

    if (!subject) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler("You are not authorized to upload assignments for this subject", 403);
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      filepath: request.file.path,
      publicId: request.file.public_id,
      filename: request.file.originalname,
      subject: subjectId,
      uploadedBy: faculty._id,
      submissions: []
    });

    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectAssignments: assignment._id },
    });

    // Notify all students in the subject's course
    const students = await Student.find({ 
      course: subject.course,
      semester: subject.semester 
    });

    for (const student of students) {
      await createNotification({
        recipient: student._id,
        recipientModel: 'Student',
        title: 'New Assignment',
        message: `New assignment posted for ${subject.subjectName}: ${title}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'ASSIGNMENT',
        relatedId: assignment._id
      });
    }

    return reply.code(201).send({
      success: true,
      message: "Assignment uploaded successfully",
      assignment
    });
  } catch (error) {
    if (request.file && request.file.public_id) {
      await deleteFile(request.file.public_id);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const submitAssignment = async (request, reply) => {
  try {
    const student = request.user;
    const { assignmentId } = request.params;

    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler("Assignment not found", 404);
    }

    // Check if submission is past due date
    if (new Date() > new Date(assignment.dueDate)) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler("Assignment submission deadline has passed", 400);
    }

    // Check if student has already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === student._id.toString()
    );

    if (existingSubmission) {
      // Delete old submission from Cloudinary
      await deleteFile(existingSubmission.publicId);
      
      // Update existing submission
      existingSubmission.filepath = request.file.path;
      existingSubmission.publicId = request.file.public_id;
      existingSubmission.submittedAt = Date.now();
    } else {
      // Add new submission
      assignment.submissions.push({
        filepath: request.file.path,
        publicId: request.file.public_id,
        student: student._id,
        submittedAt: Date.now()
      });
    }

    await assignment.save();

    // Notify faculty
    await createNotification({
      recipient: assignment.uploadedBy,
      recipientModel: 'Faculty',
      title: 'New Assignment Submission',
      message: `${student.name} has submitted the assignment: ${assignment.title}`,
      type: 'ASSIGNMENT',
      relatedId: assignment._id
    });

    return reply.code(200).send({
      success: true,
      message: "Assignment submitted successfully"
    });
  } catch (error) {
    if (request.file && request.file.public_id) {
      await deleteFile(request.file.public_id);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};