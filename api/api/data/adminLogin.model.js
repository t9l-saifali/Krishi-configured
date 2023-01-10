var mongoose = require('mongoose');
var adminSchema = new mongoose.Schema({
    username : {
        type : String,
        required : false,
        lowercase: true,
        default:null
    },
    user_role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'role',
        required: false,
    },
    email : {
        type:String
    },
    password : {
        type : String,
        required : false,
        default:null
    },
    user_type: {
        type : String,
        required : false,
        default:'admin'
    },
    mobile : {
        type : Number,
        required : false,
        default:null
    },
    status: {
        type: Boolean,
        require: false
    },
    created_at : {
        type : Date,
        required : false,
        default: Date.now(),
        timezone: "Asia/Kolkata",
    }
});

mongoose.model('admin',adminSchema);