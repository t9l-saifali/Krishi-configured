var mongoose = require("mongoose");

var CollectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        lowercase: true,
        default: null,
    },
    stateData: [
        {
            stateName: {
                type: String,
                required: false,
                lowercase: true,
                default: null,
            },
            status: {
                type: Boolean,
                default: true,
            },
            regionData: [
                {
                    district: {
                        type: String,
                        default: null,
                    },
                    deliveryCharges: {
                        type: Number,
                        default: 0,
                    },
                    codAvailable: {
                        type: Boolean,
                        default: false,
                    },
                    codCharges: {
                        type: Number,
                        default: 0,
                    },
                    minimumOrderValue: {
                        type: Number,
                        default: 0,
                    },
                    status: {
                        type: Boolean,
                        default: true,
                    },
                },
            ],
        },
    ],

    // regionData : {
    //     type : Array,
    //     required : false
    // },
    status: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata"
    },
});
mongoose.model("regions", CollectionSchema);
