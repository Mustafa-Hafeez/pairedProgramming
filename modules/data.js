// /backend/data.js
require('dotenv').config();
const ULID = require('ulid');

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

const ProblemsSchema = new Schema(
    {
        id: String,
        name: String,
        description: String,
        code: String,
        defaultOutput: String
    },
    { timestamps: true }
);

let Problems = mongoose.model("Problems2", ProblemsSchema);

function findByID(wid, callback) {
    Problems.findOne({id: wid}, callback);
}

function getProblems(callback) {
    Problems.find({}, callback);
}

function createProblem(data, callback) {
    if (!data.code || !data.name) return callback("Invalid input", null);
    var wid = ULID.ulid();
    var problem = {
        id: wid,
        name: data.name,
        description: data.description,
        code: data.code,
        defaultOutput: ''
    };
    Problems.create(problem, (err, doc) => {
        callback(err, doc);
    });
}

function updateProblem(id, new_data, callback) {
    Problems.updateOne({id: id}, new_data, callback);
}

function deleteProblem(id, callback) {
    
    Problems.deleteOne({id: id}, callback);
}

// export the new Schema so we could modify it using Node.js
module.exports = {
    createProblem: createProblem,
    findByID:findByID,
    updateProblem:updateProblem,
    deleteProblem:deleteProblem,
    getProblems:getProblems
};