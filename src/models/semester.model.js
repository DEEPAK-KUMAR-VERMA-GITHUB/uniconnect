import mongoose from "mongoose";
const semesterSchema = new mongoose.Schema({
    semesterName: {
        type: String,
        required: true,
        unique: true,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
    }, ],
});