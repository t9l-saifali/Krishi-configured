var mongoose = require('mongoose');
const moment = require('moment-timezone');
const DateIndia = moment.tz(Date.now(), "Asia/Kolkata");

var CategorySchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    reportType:{
        type : String,
        required : false,
        default: null
    },
    fileName:{
        type : String,
        required : false,
        default: null
    },
    startDate:{
        type : Date,
        required : false,
        default: null
    },
    endDate:{
        type : Date,
        required : false,
        default: null
    },
    status : {
        type:Boolean,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    }
});

// CategorySchema.pre("save", function(next) {
//     let substract530 = (date) => {
//         let date1 = new Date(date);
//         date1.setHours(date1.getHours() - 5);
//         date1.setMinutes(date1.getMinutes() - 30);
//         return date1;
//     }
//     this.startDate = substract530(this.startDate)
//     this.endDate = substract530(this.endDate)
//     next()
// });

mongoose.model('report_generations',CategorySchema);
