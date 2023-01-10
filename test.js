const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt  = require('jsonwebtoken');
const {isAuthenticatedUser} = require('../middleware/auth');
const bcrypt = require('bcrypt');
const user = require('../model/user');
const multer = require("multer");
var fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/");
  },
  filename: function (req, file, cb) {
    var ext = file.mimetype.split("/");
    if (req.body.type == "audio") {
      cb(null, Date.now().toString(16) + "-" + file.fieldname + ".mp3");
    } else {
      cb(null, uniqueId(10) + "" + Date.now() + "." + ext[1]);
    }
  },
});
var upload = multer({
  storage: fileStorage,
}).single("profileImg");

function uniqueId(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

router.post('/signup',async(req,res,next)=>{
    try {
        upload(req, res, async function (err) {
            bcrypt.hash(req.body.password,10,async(err,hash)=>{
                if(err)
                {
                    return res.status(500).json({
                        error:err
                    })
                }
                else{
                    await user.create({
                        _id: new mongoose.Types.ObjectId,
                        username:req.body.username,
                        password:hash,
                        phone:req.body.phone,
                        email:req.body.email,
                        userType:req.body.userType,
                        profileImg:req.file.filename
                    })
                    .then(result=>{
                        res.status(200).json({
                            new_user:result
                        })
                    })
                    .catch(err=>{
                        res.status(500).json({
                            error:err
                    
                        })
                    })
                }
            })
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({
            success:false,
            message:"something went wrong"
        })
    }
    
})


module.exports = router;

router.post('/login',(req,res,next)=>{
    user.find({username:req.body.username})
    .then(user=>{
        if(user.length<1)
        {
            return res.status(401).json({
                msg:'user not exist'
            })
        }
        bcrypt.compare(req.body.password,user[0].password,(err,result)=>{
            if (!result)
            {
                return res.status(401).json({
                    msg:'password matching fail'

                })
            }
            if (result)
            {
                const token = jwt.sign({
                    username:user[0].username,
                    id:user[0]._id,
                    userType:user[0].userType,
                    email:user[0].email,
                    phone:user[0].phone
                },
                'this is dummy text',
                {
                    expiresIn:"24h"
                }
                );
                res.status(200).json({
                    username:user[0].username,
                    userType:user[0].userType,
                    email:user[0].email,
                    phone:user[0].phone,
                    token:token
                })
            }

         })
    })
    .catch(err=>{
        res.status(500).json({
            err:err
        })
    })
})

router.get('/All',isAuthenticatedUser,(req,res,next)=>{
    user.find()
    .then(result=>{
        res.status(200).json({
            studentData:result
        });
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            error:err
        })
    });
    
})


let users = {}
for(let i of arr){
    if(i.M_from_user?._id){
        users[i.M_from_user?._id] = {
            ...users[i.M_from_user?._id],
             lastMessage : i.Message.Message,
             unseenMessage:!i.seen && users[i.M_from_user?._id]?.unseenMessage ? users[i.M_from_user?._id]?.unseenMessage + 1 : 0,
             name:i.M_from_user?.name
        }
    }
    if(Object.keys(users).includes(i.M_from_user?._id) || Object.keys(users).includes(i.M_to_user?._id)){
        users[i.M_from_user?._id || i.M_to_user?._id] = {
             lastMessage : i.Message.Message,
        }
    }
  }
  console.log(users)