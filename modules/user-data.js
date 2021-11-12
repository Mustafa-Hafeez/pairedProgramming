// /backend/user-data.js
require('dotenv').config();
const Users = require('../modules/users');
const Data = require('../modules/data');

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

const UserDataSchema = new Schema(
    {
        email: String,
        id: String,
        attempts: [new Schema({
            code: String,
            lloc: Number,
            output: String,
            elapsedTime: Number
        }, { timestamps: true })],
        isPair: Boolean,
        pairNum: Number,
        complete: Boolean
    },
    { timestamps: true }
); 

let UserData = mongoose.model("UserData2", UserDataSchema);

function findByEmail(email, callback) {
    UserData.findOne({email: email}, callback);
}

function getAttempts(email, id, callback) {
    UserData.findOne({email: email, id: id}, callback);
}

function getAllAttempts(id, callback) {
    UserData.find({id: id}, callback);
}

function getProblemData(id, callback) {
    UserData.findOne({id: id}, callback);
}

function addAttempt(email, id, data, callback) {
    let lineCount = 0;
    let spaceSplits = data.code.split("%0A");
    for (var i = 0; i < spaceSplits.length; i++) {
        if (spaceSplits[i].length != 0) lineCount++;
    }
    var attempt = {
        code: data.code,
        lloc: lineCount,
        output: data.output,
        elapsedTime: data.elapsedTime
    }

    UserData.findOne({email:email, id:id}, (err, data) => {

        if (err || !data) {
            Users.findByEmail(email, (err, data) => {
                if (err || !data) {
                    return callback("Invalid input", null);
                }
                else {
                    Data.findByID(id, (err, data) => {
                        if (err || !data) {
                            return callback("Invalid input", null);
                        }
                        else {
                            var userdata = {
                                email:email,
                                id: id,
                                attempts: [attempt],
                                complete: false
                            };
                
                            UserData.create(userdata, (err, doc) => {
                                callback(err, doc);
                            });
                        }
                    });
                }
            });
        }
        else {

            UserData.updateOne({email: email, id: id}, {$push: {attempts: attempt}}, callback);
        }
    });
    
}
function completeProblem(email, id, isPair, pairNum, callback) {

    console.log(callback);

    UserData.findOne({email:email, id:id}, (err, data) => {

        if (err || !data) {
            return callback("Invalid input", null);
        }
        else {
            UserData.updateOne({email: email, id: id}, {isPair: isPair, pairNum: pairNum, complete: true}, (err, data) => {
                console.log(err, data, callback);
                callback(err, data);
            });
        }
    });
    
}

function deleteProblem(id, callback) {
    
    UserData.deleteOne({id: id}, callback);
}

// export the new Schema so we could modify it using Node.js
module.exports = {
    findByEmail:findByEmail,
    getAttempts:getAttempts,
    getProblemData:getProblemData,
    deleteProblem:deleteProblem,
    addAttempt:addAttempt,
    completeProblem:completeProblem,
    getAllAttempts:getAllAttempts
};