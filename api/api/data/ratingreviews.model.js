var mongoose = require("mongoose");

var Schema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    require: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    require: true,
  },
  rating:{
    type:Number,
    default:0
  },
  review:{
    type:String,
    default:0
  },
  image:{
    type:String,
    default:null
  }
});

module.exports = mongoose.model("ratingreviews", Schema);
