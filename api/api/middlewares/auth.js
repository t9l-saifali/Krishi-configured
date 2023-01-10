let jwt = require("jsonwebtoken");
require("dotenv").config();

var mongoose = require("mongoose");
var User = mongoose.model("Users");
var Admin = mongoose.model("admin");

// module.exports.authenticate = (req, res, next) => {
//   // next();
//   // return;
//   let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
//   if (token && token.includes("Bearer ")) {
//     // Remove Bearer from string
//     token = token.split("Bearer ")[1];
//   }

//   if (token) {
//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//       if (err) {
//         return res.status(503).json({
//           success: false,
//           message: "Token is not valid",
//         });
//       } else {
//         req.decoded = decoded;
//         next();
//       }
//     });
//   } else {
//     return res.status(503).json({
//       success: false,
//       message: "Auth token absent",
//     });
//   }
// };
module.exports.authenticate = (req, res, next) => {
  // next();
  // return;
  let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
  if (token && token.includes("Bearer ")) {
    // Remove Bearer from string
    token = token.split("Bearer ")[1];
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(503).json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(503).json({
      success: false,
      message: "Auth token absent",
    });
  }
};
module.exports.authenticateAdmin = (req, res, next) => {
  // next();
  // return;
  let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
  if (token && token.includes("Bearer ")) {
    // Remove Bearer from string
    token = token.split("Bearer ")[1];
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(503).json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        // console.log("decoded ::::::::::::::::", decoded);
        req.decoded = decoded;
        if (decoded.ID) {
          let doc = await Admin.findOne({ _id: decoded.ID });
          if (doc) {
            next();
          } else {
            return res.status(503).json({
              success: false,
              message: "Token is not valid",
            });
          }
        }
      }
    });
  } else {
    return res.status(503).json({
      success: false,
      message: "Auth token absent",
    });
  }
  // next();
};

// module.exports.authenticateUser = (req, res, next) => {
//   // next();
//   // return;
//   let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
//   if (token && token.includes("Bearer ")) {
//     // Remove Bearer from string
//     token = token.split("Bearer ")[1];
//   }

//   if (token) {
//     jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
//       if (err) {
//         return res.status(503).json({
//           success: false,
//           message: "Token is not valid",
//         });
//       } else {
//         // console.log("decoded ::::::::::::::::", decoded);
//         req.decoded = decoded;
//         if (decoded.ID) {
//           let doc = await User.findOne({ _id: decoded.ID });
//           if (doc) {

//             next();
//           } else {
//             return res.status(503).json({
//               success: false,
//               message: "Token is not valid",
//             });
//           }
//         }
//       }
//     });
//   } else {
//     return res.status(503).json({
//       success: false,
//       message: "Auth token absent",
//     });
//   }
// };

module.exports.authenticateUser = (req, res, next) => {
  // next();
  // return;
  let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
  if (token && token.includes("Bearer ")) {
    // Remove Bearer from string
    token = token.split("Bearer ")[1];
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(503).json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        // console.log("decoded ::::::::::::::::", decoded);
        req.decoded = decoded;
        if (decoded.ID) {
          let doc = await User.findOne({ _id: decoded.ID });
          console.log(doc, "doccccccccccc");
          // if ((doc.isLogedIn === true && doc.ip == req.headers["x-forwarded-for"]) || req.socket.remoteAddress) {

          if (doc?.isLogedIn === true && (doc?.token === token || doc?.tokens.includes(token))) {
            next();
          } else {
            return res.status(503).json({
              success: false,
              message: "Token is not valid",
            });
          }
        }
      }
    });
  } else {
    return res.status(503).json({
      success: false,
      message: "Auth token absent",
    });
  }
};
