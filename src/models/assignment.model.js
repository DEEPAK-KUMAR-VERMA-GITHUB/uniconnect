import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  submissions: [
    {
      filepath: {
        type: String,
        required: true,
      },
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
    },
  ],
});
export default Assignment = mongoose.model("Assignment", assignmentSchema);
