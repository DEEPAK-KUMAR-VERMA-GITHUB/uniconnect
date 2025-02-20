import mongoose from "mongoose";
const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    unique: true,
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true,
  },
  subjectFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  },
  subjectNotes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
  },
  subjectAssignments: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
  },
  subjectPYQs: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PYQ",
  },
});

const Subject = mongoose.model("Subject", subjectSchema);
