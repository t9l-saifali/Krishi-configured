var mongoose = require('mongoose');

var PageSchema = mongoose.Schema({

    addedby: { type: mongoose.Schema.Types.ObjectId, ref: 'admins' },
    priority: {
        type: Number,
        default: Infinity,
    },
    name:{
    	type: String,
	    default:null
    },
    title:{
	    type: String,
	    default:null
	},	
	image:{
        type: String,
        default:null
    },
    icon:{
        type: String,
        default:null
    },
    detail:{
        type: String,
        default:null
    },
    meta_title:{
	    type: String,
	    default:null
	},
	meta_desc:{
	    type: String,
	    default:null
	},
    HeaderVisibility:{
        type: Boolean,
        default:true
    },
    FooterVisibility:{
        type: Boolean,
        default:true
    },
    createDate: {
        type: Date,
        timezone: "Asia/Kolkata",
        default: Date.now()
        
    },
    updateDate: {
        type: Date,
        timezone: "Asia/Kolkata",
        default: null
    },
    status:{
        type: Boolean,
        default:true
    },

});

module.exports = mongoose.model('pages', PageSchema);