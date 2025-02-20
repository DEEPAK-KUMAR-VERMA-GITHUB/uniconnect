import { Note } from "../models/note.model.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { Subject } from "../models/subject.model.js";

import mongoose from 'mongoose';
import { Note } from "../models/note.model.js";
import { Subject } from "../models/subject.model.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'notes'
  });
});

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
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
      throw new ErrorHandler("You are not authorized to upload notes for this subject", 403);
    }

    const note = await Note.create({
      title,
      description,
      filepath: request.file.id, // Store the GridFS file ID
      uploadedBy: faculty._id,
      subject: subjectId,
      semester: subject.semester,
      year: subject.year,
      type,
      filename: request.file.filename
    });

    // Update subject with new note reference
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectNotes: note._id },
    });

    return reply.code(201).send({
      success: true,
      message: "Notes uploaded successfully",
      note
    });
  } catch (error) {
    // If there's an error and file was uploaded, delete it
    if (request.file && request.file.id) {
      await gfs.delete(new mongoose.Types.ObjectId(request.file.id));
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Add a function to stream/download the PDF
export const getNoteFile = async (request, reply) => {
  try {
    const note = await Note.findById(request.params.id);
    if (!note) {
      throw new ErrorHandler("Note not found", 404);
    }

    const file = await gfs.find({ _id: new mongoose.Types.ObjectId(note.filepath) }).toArray();
    if (!file || file.length === 0) {
      throw new ErrorHandler("File not found", 404);
    }

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${note.filename}"`);
    
    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(note.filepath));
    return reply.send(downloadStream);

  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// function for remove a note upload by the faculty
export const removeNote = async (request, reply) => {
  try {
    const faculty = request.user;
    const noteId = request.params.id;

    const note = await Note.findOne({ _id: noteId, uploadedBy: faculty._id });
    if (!note) {
      throw new ErrorHandler("Note not found or you are not authorized to delete this note", 404);
    }

    // Delete the note file from GridFS
    await gfs.delete(new mongoose.Types.ObjectId(note.filepath));

    // Remove the note reference from the subject
    await Subject.findByIdAndUpdate(note.subject, {
      $pull: { subjectNotes: note._id },
    });

    // Delete the note document from the database
    await Note.findByIdAndDelete(noteId);

    return reply.code(200).send({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};