var mongoose = require('mongoose');
var SubCategory2Schema = new mongoose.Schema(
{
	level:
	{
		type: String,
		required: false
	},
	parentCat_id:
	{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'subCategory1s'
	},

	category_name:
	{
		type: String,
		required: false,
        lowercase: true
	},
	parent:
	{
		type: String,
		required: false
	},
	banner : {
        type : String,
        required : false
    },
    icon : {
        type : String,
        required : false
    },
    category_code : {
        type : String,
        required : false
    },
    tex_percent : {
        type : Number,
        required : false
    },
    meta_title: {
        type : String,
        required : false
    },
    meta_keyword: {
        type : String,
        required : false
    },
    meta_desc: {
        type : String,
        required : false
    },
    productAdded: {
        type : Boolean,
        required : false
    },
    status : {
        type:Boolean,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now
    }
});
mongoose.model('subCategory2', SubCategory2Schema);