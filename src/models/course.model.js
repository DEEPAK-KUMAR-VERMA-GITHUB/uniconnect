// course model for course collection
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseName: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  },
  courseSemesters: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Semester"
  },
  courseYear: {
    type: Number,
    required: true,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
