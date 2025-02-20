import mongoose from "mongoose";
import { PYQ } from "../models/pyq.model.js";
import { Subject } from "../models/subject.model.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { createObjectId } from "../utils/createObjectId.js";

let gfs;
mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "pyqs",
  });
});

export const uploadSubjectPYQ = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, subjectId, year, semester } = request.body;

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
      filepath: request.file.id,
      filename: request.file.filename,
      uploadedBy: faculty._id,
    });

    // Update subject with new PYQ reference
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { subjectPYQs: pyq._id },
    });

    return reply.code(201).send({
      success: true,
      message: "PYQ uploaded successfully",
      pyq,
    });
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (request.file && request.file.id) {
      await gfs.delete(createObjectId(request.file.id));
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Function to download/view PYQ
export const getPYQFile = async (request, reply) => {
  try {
    const pyq = await PYQ.findById(request.params.id);
    if (!pyq) {
      throw new ErrorHandler("PYQ not found", 404);
    }

    const file = await gfs
      .find({ _id: createObjectId(pyq.filepath) })
      .toArray();
    if (!file || file.length === 0) {
      throw new ErrorHandler("File not found", 404);
    }

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `inline; filename="${pyq.filename}"`);

    const downloadStream = gfs.openDownloadStream(createObjectId(pyq.filepath));
    return reply.send(downloadStream);
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// function to remove pyq
export const removePYQ = async (request, reply) => {
  try {
    const faculty = request.user;
    const pyqId = request.params.id;

    const pyq = await PYQ.findOne({ _id: pyqId, uploadedBy: faculty._id });
    if (!pyq) {
      throw new ErrorHandler(
        "PYQ not found or you are not authorized to delete this PYQ",
        404
      );
    }

    // Delete the PYQ file from GridFS
    await gfs.delete(createObjectId(pyq.filepath));

    // Remove the PYQ reference from the subject
    await Subject.findByIdAndUpdate(pyq.subject, {
      $pull: { subjectPYQs: pyq._id },
    });

    // Delete the PYQ document from the database
    await PYQ.findByIdAndDelete(pyqId);

    return reply.code(200).send({
      success: true,
      message: "PYQ deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};
