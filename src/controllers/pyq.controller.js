import { deleteFile } from "../utils/cloudinaryConfig.js";
import { createNotification } from "./notification.controller.js";
import { Subject } from "../models/subject.model.js";
import { PYQ } from "../models/pyq.model.js";
import { Student } from "../models/student.model.js";

export const uploadSubjectPYQ = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, subjectId, year, semester } = request.body;

    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      subjectFaculty: faculty._id,
    });

    if (!subject) {
      await deleteFile(request.file.public_id);
      throw new ErrorHandler(
        "You are not authorized to upload PYQs for this subject",
        403
      );
    }

    const pyq = await PYQ.create({
      title,
      subject: subject.subjectName,
      year,
      semester,
      filepath: request.file.path,
      publicId: request.file.public_id,
      filename: request.file.originalname,
      uploadedBy: faculty._id,
    });

    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectPYQs: pyq._id },
    });

    // Notify students about new PYQ
    const students = await Student.find({
      course: subject.course,
      semester: subject.semester,
    });

    for (const student of students) {
      await createNotification({
        recipient: student._id,
        recipientModel: "Student",
        title: "New Previous Year Question Paper",
        message: `New PYQ uploaded for ${subject.subjectName}: ${title} (${year})`,
        type: "PYQ",
        relatedId: pyq._id,
      });
    }

    return reply.code(201).send({
      success: true,
      message: "PYQ uploaded successfully",
      pyq,
    });
  } catch (error) {
    if (request.file && request.file.public_id) {
      await deleteFile(request.file.public_id);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const deletePYQ = async (request, reply) => {
  try {
    const pyq = await PYQ.findById(request.params.id);

    if (!pyq) {
      throw new ErrorHandler("PYQ not found", 404);
    }

    if (pyq.uploadedBy.toString() !== request.user._id.toString()) {
      throw new ErrorHandler("Not authorized to delete this PYQ", 403);
    }

    await deleteFile(pyq.publicId);
    await Subject.findOneAndUpdate(
      { subjectName: pyq.subject },
      { $pull: { subjectPYQs: pyq._id } }
    );
    await pyq.remove();

    return reply.code(200).send({
      success: true,
      message: "PYQ deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};
