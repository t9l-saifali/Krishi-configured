var mongoose = require("mongoose");

var CollectionSchema = new mongoose.Schema({
  Pincode: { type: String, lowercase: true, default: "yes" },
  Region_ID: { type: String, lowercase: true, default: "yes" },
  Free_Shipping: { type: String, lowercase: true, default: "yes" },
  MOQ: { type: String, lowercase: true, default: "yes" },
  COD: { type: String, lowercase: true, default: "yes" },
  Farm_pick_up: { type: String, lowercase: true, default: "yes" },
  farm_pick_up_time: { type: String, default: null },
  Same_day_delivery_till_2pm: { type: String, lowercase: true, default: "yes" },
  same_day_delivery_time: { type: String, default: null },
  Slot1String: { type: String, lowercase: true, default: null },
  Next_day_delivery_Standard_9am_9pm: { type: String, lowercase: true, default: "yes" },
  Slot2String: { type: String, lowercase: true, default: null },
  Next_day_delivery_8am_2pm: { type: String, lowercase: true, default: "yes" },
  Slot3String: { type: String, lowercase: true, default: null },
  Next_day_delivery_2pm_8pm: { type: String, lowercase: true, default: "yes" },
  Slot4String: { type: String, lowercase: true, default: null },
  Standard_delivery: { type: String, lowercase: true, default: "yes" },
  Slot5String: { type: String, lowercase: true, default: null },
});
mongoose.model("pincodesettings", CollectionSchema);
