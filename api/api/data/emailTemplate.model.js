var mongoose = require("mongoose");
var Schema = mongoose.Schema;
/*
 *Define structure of collection
 */
var emailTemplateSchema = new Schema({
  template_name: {
    type: String, // name of email template
    required: true,
  },
  email_subject: {
    type: String, // for subject which will display in mail subject
    required: true,
  },
  email_text: {
    type: String, // for email body which will display in mail message body
    required: true,
  },
  status: {
    type: Boolean, // 0: inactive, 1: active
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    timezone: "Asia/Kolkata"
  },
  updated_at: {
    type: Date,
    default: Date.now,
    timezone: "Asia/Kolkata"
  },
});
/*
 *Define model and export it for use in other page
 */
mongoose.model("email_templates", emailTemplateSchema);
