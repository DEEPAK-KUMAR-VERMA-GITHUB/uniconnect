import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required']
  },
  content: {
    type: String,
    required: [true, 'Notice content is required']
  },
  attachment: {
    filepath: String,
    publicId: String,
    filename: String
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  targetAudience: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    semester: Number
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
noticeSchema.index({ expiresAt: 1 });
noticeSchema.index({ 'targetAudience.course': 1, 'targetAudience.semester': 1 });

export const Notice = mongoose.model('Notice', noticeSchema);