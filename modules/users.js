// /backend/data.js
require('dotenv').config()
const bcrypt = require('bcrypt');

function getRandomInt(max) {
    return Math.abs(Math.floor(Math.random() * Math.floor(max))) + 1;
}

const mongoose = require("mongoose");
// this is our MongoDB database
// const dbRoute = process.env.DB_HOST;

// connects our back end code with the database
// mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
// checks if connection with the database is successful
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const Schema = mongoose.Schema;
// this will be our data base's data structure 
const UserSchema = new Schema(
    {
        email: String,
        username: String,
        password: String,
        firstname: String,
        lastname: String,
        type: String,
        admin: Boolean,
        utorid: String
    },
    { timestamps: true }
);

let Users = mongoose.model("Users", UserSchema);

function verifyPass(data, password) {
    if (!data || !password) return false;

    return bcrypt.compareSync(password, data.password);;
}

function findByEmail(email, callback) {
    Users.findOne({email: email}, callback);
}

function getAll(callback) {
    Users.find({}, callback);
}

function findByUsername(id, callback) {
    Users.findOne({username: id}, callback);
}

function createUser(data, callback) {
    var salt = parseInt(process.env.SALT_ROUNDS) || 15;
    var saltS = bcrypt.genSaltSync(salt);
    var pass = bcrypt.hashSync(data.password, saltS);
    var user = {
        email: data.email,
        username: data.username,
        password: pass,
        firstname: data.firstname,
        lastname: data.lastname,
        type:data.type,
        admin:false,
        utorid:''
    };
    Users.create(user, callback);
}

function addUtorID(selector, utorid, callback) {
    Users.updateOne(selector, {utorid: utorid}, callback);
}

// export the new Schema so we could modify it using Node.js
module.exports = {findByEmail: findByEmail, findByUsername:findByUsername, createUser:createUser, verifyPass:verifyPass, getAll:getAll, addUtorID:addUtorID};