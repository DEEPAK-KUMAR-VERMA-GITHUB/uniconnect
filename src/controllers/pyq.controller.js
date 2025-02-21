import { deleteFile } from "../utils/cloudinaryConfig.js";
import { createNotification } from "./notification.controller.js";
import { Subject, Student } from "../models/index.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { PYQ } from "../models/pyq.model.js";
import { Subject } from "../models/subject.model.js";
import { Student } from "../models/student.model.js";

export const uploadSubjectPYQ = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, subjectId, year, semester, examType } = request.body;

    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    // Validate exam type
    const validExamTypes = ["MID_TERM", "END_TERM", "PRACTICAL"];
    if (!validExamTypes.includes(examType)) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler("Invalid exam type", 400);
    }

    // Verify subject and faculty authorization
    const subject = await Subject.findOne({
      _id: subjectId,
      subjectFaculty: faculty._id,
    }).populate("course");

    if (!subject) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler(
        "You are not authorized to upload PYQs for this subject",
        403
      );
    }

    // Create PYQ with organized structure
    const pyq = await PYQ.create({
      title,
      subject: subject._id,
      year,
      semester,
      examType,
      filepath: request.file.path,
      publicId: request.file.public_id,
      filename: request.file.originalname,
      uploadedBy: faculty._id,
      course: subject.course._id,
    });

    // Update subject with new PYQ reference
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectPYQs: pyq._id },
    });

    // Notify relevant students
    const students = await Student.find({
      course: subject.course._id,
      semester: semester,
      isActive: true,
    });

    const notificationPromises = students.map((student) =>
      createNotification({
        recipient: student._id,
        recipientModel: "Student",
        title: `New ${examType} Question Paper`,
        message: `${subject.subjectName}: ${title} (${year}) has been uploaded`,
        type: "PYQ",
        relatedId: pyq._id,
      })
    );

    await Promise.all(notificationPromises);

    return reply.code(201).send({
      success: true,
      message: "PYQ uploaded successfully",
      pyq,
    });
  } catch (error) {
    if (request.file?.public_id) {
      await deleteFile(request.file.public_id).catch(console.error);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const getPYQs = async (request, reply) => {
  try {
    const { subjectId, year, semester, examType } = request.query;
    const query = {};

    if (subjectId) query.subject = subjectId;
    if (year) query.year = year;
    if (semester) query.semester = semester;
    if (examType) query.examType = examType;

    const pyqs = await PYQ.find(query)
      .populate("subject", "subjectName subjectCode")
      .populate("uploadedBy", "name")
      .sort({ year: -1, createdAt: -1 });

    return reply.code(200).send({
      success: true,
      pyqs,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};
