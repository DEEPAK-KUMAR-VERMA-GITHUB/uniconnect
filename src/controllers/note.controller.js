import { Student } from "../models/user.model.js";
import { Subject } from "../models/subject.model.js";
import { deleteFile } from "../utils/cloudinaryConfig.js";
import { createNotification } from "./notification.controller.js";
import { Note } from "../models/note.model.js";

export const uploadSubjectNotes = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, description, subjectId, type } = request.body;

    if (!request.file) {
      throw new ErrorHandler("Please upload a PDF file", 400);
    }

    // Verify if subject exists and faculty teaches it
    const subject = await Subject.findOne({
      _id: subjectId,
      subjectFaculty: faculty._id,
    });

    if (!subject) {
      // Delete uploaded file if subject verification fails
      await deleteFile(request.file.public_id);
      throw new ErrorHandler(
        "You are not authorized to upload notes for this subject",
        403
      );
    }

    const note = await Note.create({
      title,
      description,
      filepath: request.file.path, // Cloudinary URL
      publicId: request.file.public_id, // Store Cloudinary public_id
      uploadedBy: faculty._id,
      subject: subjectId,
      semester: subject.semester,
      year: subject.year,
      type,
      filename: request.file.originalname,
    });

    // Update subject with new note reference
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectNotes: note._id },
    });

    // Create notification for all students in the subject's course
    const students = await Student.find({
      course: subject.course,
      semester: subject.semester,
    });

    for (const student of students) {
      await createNotification({
        recipient: student._id,
        recipientModel: "Student",
        title: "New Notes Available",
        message: `New ${type} notes uploaded for ${subject.subjectName}: ${title}`,
        type: "NOTE",
        relatedId: note._id,
      });
    }

    return reply.code(201).send({
      success: true,
      message: "Notes uploaded successfully",
      note,
    });
  } catch (error) {
    // If there's an error and file was uploaded, delete it
    if (request.file && request.file.public_id) {
      await deleteFile(request.file.public_id);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const deleteNote = async (request, reply) => {
  try {
    const note = await Note.findById(request.params.id);

    if (!note) {
      throw new ErrorHandler("Note not found", 404);
    }

    // Check if faculty owns this note
    if (note.uploadedBy.toString() !== request.user._id.toString()) {
      throw new ErrorHandler("Not authorized to delete this note", 403);
    }

    // Delete file from Cloudinary
    await deleteFile(note.publicId);

    // Remove note reference from subject
    await Subject.findByIdAndUpdate(note.subject, {
      $pull: { subjectNotes: note._id },
    });

    // Delete note from database
    await note.remove();

    return reply.code(200).send({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};
