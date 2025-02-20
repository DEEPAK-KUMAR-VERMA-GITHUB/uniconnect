import mongoose from 'mongoose';
import { Assignment } from "../models/assignment.model.js";
import { Subject } from "../models/subject.model.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { createObjectId } from '../utils/createObjectId.js';

let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'assignments'
  });
});

// Faculty uploads assignment
export const uploadAssignment = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, description, dueDate, subjectId } = request.body;
    
    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    // Verify if subject exists and faculty teaches it
    const subject = await Subject.findOne({
      _id: subjectId,
      subjectFaculty: faculty._id,
    });

    if (!subject) {
      await gfs.delete(createObjectId(request.file.id));
      throw new ErrorHandler("You are not authorized to upload assignments for this subject", 403);
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      filepath: request.file.id,
      filename: request.file.filename,
      subject: subjectId,
      uploadedBy: faculty._id,
      submissions: []
    });

    // Update subject with new assignment reference
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectAssignments: assignment._id },
    });

    return reply.code(201).send({
      success: true,
      message: "Assignment uploaded successfully",
      assignment
    });
  } catch (error) {
    if (request.file && request.file.id) {
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Student submits assignment
export const submitAssignment = async (request, reply) => {
  try {
    const student = request.user;
    const { assignmentId } = request.params;
    
    if (!request.file) {
      throw new ErrorHandler("Please upload your submission", 400);
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await gfs.delete(createObjectId(request.file.id));
      throw new ErrorHandler("Assignment not found", 404);
    }

    // Check if submission deadline has passed
    if (new Date(assignment.dueDate) < new Date()) {
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
      throw new ErrorHandler("Submission deadline has passed", 400);
    }

    // Check if student has already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === student._id.toString()
    );

    if (existingSubmission) {
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
      throw new ErrorHandler("You have already submitted this assignment", 400);
    }

    assignment.submissions.push({
      filepath: request.file.id,
      filename: request.file.filename,
      student: student._id,
      submittedAt: new Date()
    });

    await assignment.save();

    return reply.code(201).send({
      success: true,
      message: "Assignment submitted successfully"
    });
  } catch (error) {
    if (request.file && request.file.id) {
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Get assignment file
export const getAssignmentFile = async (request, reply) => {
  try {
    const assignment = await Assignment.findById(request.params.id);
    if (!assignment) {
      throw new ErrorHandler("Assignment not found", 404);
    }

    const file = await gfs.find({ _id: createObjectId(assignment.filepath) }).toArray();
    if (!file || file.length === 0) {
      throw new ErrorHandler("File not found", 404);
    }

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${assignment.filename}"`);
    
    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(assignment.filepath));
    return reply.send(downloadStream);
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};
