const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

mongoose.connect("mongodb+srv://omnicake:qjvfyfhjn@omnicake-cluster-1kwm6.mongodb.net/issue-tracker?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const db = mongoose.connection;
autoIncrement.initialize(db);

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {});

const issueSchema = new mongoose.Schema({
  issue_title: {
    type: String,
    required: true
  },
  issue_text: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true
  },
  assigned_to: {
    type: String
  },
  created_on: {
    type: Date,
    required: true,
    default: Date.now
  },
  updated_on: {
    type: Date,
    required: true,
    default: Date.now
  },
  open: {
    type: Boolean,
    required: true,
    default: true
  }
});

issueSchema.plugin(autoIncrement.plugin, {model : "Issue", startAt: 1});
const Issue = mongoose.model("Issue", issueSchema);

exports.Issue = Issue;
exports.connection = db;
