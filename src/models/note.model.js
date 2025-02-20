import mongoose from "mongoose";

const notesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  },
  uploadedOn: {
    type: Date,
    default: Date.now,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Year",
  },
  type: {
    type: String,
    required: true,
  },
});

export default Notes = mongoose.model("Note", notesSchema);
