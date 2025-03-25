const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  type: {
    type: String,
    enum: ["weekly", "monthly", "quarterly"],
    required: true,
  },
  assessmentName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 5,
    required: true,
  },
  comments: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assessment", assessmentSchema);
