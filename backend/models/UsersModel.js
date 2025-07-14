const { text } = require('express')
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {type:String, require: true},
    link: {type:String, require: true},
    status: {type:Boolean, require: true, default: false},
})

module.exports = new mongoose.model('User', UserSchema)