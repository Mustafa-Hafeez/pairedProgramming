// /backend/data.js
require('dotenv').config()
const bcrypt = require('bcrypt');

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
const ErrorSchema = new Schema(
    {
        error: String,
        filter: String,
        type1: String,
        type2: String
    },
    { timestamps: true }
);

let Errors = mongoose.model("Errors", ErrorSchema);


function findByError(error, callback) {
    Errors.find({error: error}, callback);
}

function findByErrorAndFilter(error, filter, callback) {
    Errors.find({error: error, filter: filter}, callback);
}

function createError(data, callback) {
    var error = {
        error: data.error,
        filter: data.filter,
        type1: data.type1,
        type2: data.type2,
    };
    Errors.create(error, callback);
}

// export the new Schema so we could modify it using Node.js
module.exports = {findByError: findByError, createError:createError, findByErrorAndFilter:findByErrorAndFilter};