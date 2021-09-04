require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const Users = require('./modules/users');
const Data = require('./modules/data');
const UserData = require('./modules/user-data');
const Errors = require('./modules/errors');
const errorParser = require('./modules/error-parser');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.SECRET);
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const withAuth = require('./modules/middleware');
var os = require('os');
var pty = require('node-pty');
const fs = require('fs');
var csv = require('csv-express');

const API_PORT = process.env.PORT || 3001;
const app = express();

app.use(cookieParser());

// this is our MongoDB database
const dbRoute = process.env.DB_HOST;

// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true});

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// functions
function encode(email) {
    if (!email) return "";
    return cryptr.encrypt(email);
}

function decode(email) {
    if (!email) return "";
    return cryptr.decrypt(email);
}

function createSession(email, req, res, data) {
    var emailhash = encode(email);
    
    const token = jwt.sign({emailhash}, process.env.SECRET, {
        expiresIn: 60*60*100
    });
    return res.cookie('token', token, { httpOnly: true }).status(200).json(data);
}

function killSession(email, req, res) {
    // kill session
    
    // const token = jwt.sign('invalid', process.env.SECRET, {
    //     expiresIn: 0*60*60*100
    // });
    return res.clearCookie("token").sendStatus(200);
}

function login(err, data, password, req, res) {
    if (!err && data) {
        var user = {
            firstname: data.firstname ,
            lastname: data.lastname,
            isAdmin: data.admin,
            id: data._id
        };
        if (Users.verifyPass(data, password)) return createSession(data.email, req, res, user);
        else res.status(401).json({ error: 0, msg: "Incorrect Password" });
    } 
    else return res.status(401).json({ error: 1, msg: "Username/Email does not exist" });
}

function runScript(email, id, code, req, res) {

    const { exec } = require('child_process');

    exec("python3 ./script.py", {timeout:5000}, (err, stdout, stderr) => {
        var result = {stdout:'', stderr:''};
        result.stdout += stdout;
        result.stdout += stderr;

        Users.findByEmail(email, (err, data) => {
            //data.type -> 1 : All users get same message
            errorParser.parse(1, result.stdout, (err, parsed) => {
                function callback(err, data) {
                    if (err) res.status(200).json({output:parsed.output, attempts:0});
                    else {
                        UserData.getAttempts(email, id, (err, data) => {
                            if (!data) {
                                res.status(200).json({output:parsed.output, attempts:0});
                            }
                            else {
                                res.status(200).json({output:parsed.output, attempts:data.attempts.length});
                            }
                        });
                    }
                    
                }
    
                var attempt = {
                    code: code,
                    output: escape(parsed.output),
                    elapsedTime: req.body.elapsedTime
                }
    
                UserData.addAttempt(email, id, attempt, callback);
            });
        });
    });
    // var result = {stdout:'', stderr:''};

    // pyProcess.on("data", data => {
    //     result.stdout += data;
    // });

    // pyProcess.on("exit", exitCode => {
    //     result.stderr = exitCode;

    //     Users.findByEmail(email, (err, data) => {
    //         errorParser.parse(data.type, result.stdout, (err, parsed) => {
    //             function callback(err, data) {
    //                 if (err) res.status(200).json({output:parsed.output, attempts:0});
    //                 else {
    //                     UserData.getAttempts(email, id, (err, data) => {
    //                         if (!data) {
    //                             res.status(200).json({output:parsed.output, attempts:0});
    //                         }
    //                         else {
    //                             res.status(200).json({output:parsed.output, attempts:data.attempts.length});
    //                         }
    //                     });
    //                 }
                    
    //             }
    
    //             var attempt = {
    //                 code: code,
    //                 output: escape(parsed.output),
    //                 elapsedTime: req.body.elapsedTime
    //             }
    
    //             UserData.addAttempt(email, id, attempt, callback);
    //         });
    //     }); 
    // });
}

function writeScript(email, id, code, req, res) {
    fs.writeFile('./script.py',code,(err) =>{
        if (err) res.status(401).json({});
        runScript(email, id, escape(code), req, res);
    });
}

function processData(res, data) {

    //res.status(200).json({data: data});
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"' + 'download-' + Date.now() + '.csv\"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // ta-da! this is cool, right?
    // stringify return a readable stream, that can be directly piped
    // to a writeable stream which is "res" (the response object from express.js)
    // since res is an abstraction over node http's response object which supports "streams"
    parseData(data, (err, data) => {
        if (!err || data) res.csv(data);
        else res.csv([]);
    });
}

function parseData(data, callback) {
    var result = []

    data.forEach(item => {
        // problem id, email, UTORID, completed, number of attempts, elapsed time, TA help, account type
        var elpsd = (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime())/1000;
        Users.findByEmail(item.email, (err, user) => {
            result.push([item.id, item.email, user.utorid, Number(item.complete), item.attempts.length, elpsd, 0, user.type]);
            if (result.length == data.length) callback(null, result);
        });
        
    });
}

app.use(express.static(path.join(__dirname, 'client/build')));

// ############################ ROUTES ##################################


// REGISTRATION
app.post('/api/signup', (req, res) => {
    const { email, username,  password, firstname, lastname} = req.body;

    Users.findByEmail(email, (err, data) => {
        if (err || !data) {
            // email doesn't exist we are good
            Users.findByUsername(username, (err, data) => {
                if (err || !data) {
                    // username doesn't exist we are good
                    Users.createUser(req.body, (err, data) => {
                        if (err) return res.status(400).json({error: err, msg:"Failed to create user."});
                        else return createSession(email, req, res, {firstname: firstname, lastname:lastname});
                    });
                } 
                else return res.status(401).json({ error: 1, msg: "Username exists" });
            });
        } 
        else {
            return res.status(401).json({ error: 0, msg: "Email exists" });
        }
    });
});

app.post('/api/signout', (req, res) => {
    const {emailhash} = req.body;
    return killSession(decode(emailhash), req, res);
});

app.post('/api/signin', (req, res) => {
    const {user, password} = req.body;

    Users.findByEmail(user, (err, data) => {
        if (err || !data) {
            Users.findByUsername(user, (err, data) => {
                return login(err, data, password, req, res);
            });
        } 
        else {
            return login(err, data, password, req, res);
        }
    });
});

app.get("/api/user", withAuth, (req, res) => {
    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    Users.findByEmail(req.email,callback);
});

app.get("/api/user/:email", withAuth, (req, res) => {
    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        delete data["password"];
        res.status(200).json({data: data});
    }

    Users.findByEmail(req.params.email,callback);
});

// app.get("/api/users/all", (req, res) => {
//     function callback(err, data) {
//         if (err) res.status(404).json({msg:"Error while getting data.", err:err});
//         res.status(200).json({data: data});
//     }

//     Users.getAll(callback);
// });

// Data

app.get("/api/problems", withAuth, (req, res) => {
    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    Data.getProblems(callback);
});

app.get("/api/problems/:id", withAuth, (req, res) => {
    const id = req.params.id;

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting workout data.", err:err});
        res.status(200).json({data: data});
    }

    Data.findByID(id, callback);
});

app.post("/api/problems", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    Users.findByEmail(email, (err, data) => {
        if (err || !data) {
            res.status(400).json({msg:"Unable to create problem."});
        } 
        else {
            if (Users.verifyPass(data, req.body.password)) {
                Data.createProblem(req.body, (err, data) => {
                    if (err) res.status(400).json({msg:"Unable to create problem."});
                    else res.status(200).json({msg:"Success!", data: data});
                });
            }
            else {
                res.status(401).json({msg:"Invalid Password."});
            }
        }
    });

    
});

app.delete("/api/problems", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    Users.findByEmail(email, (err, data) => {
        if (err || !data) {
            res.status(400).json({msg:"Can't delete, try again later."});
        } 
        else {
            if (Users.verifyPass(data, req.body.password)) {
                Data.deleteProblem(req.body.id, (err) => {
                    if (err) res.status(400).json({msg:"Can't delete, try again later."});
                    else res.status(200).json({msg:"sucess"});
                });
            }
            else {
                res.status(401).json({msg:"Invalid Password."});
            }
        }
    });
});

app.get("/api/problems/data/:id", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    Users.findByEmail(email, (err, data) => {
        if (err || !data) {
            res.status(400).json({msg:"Can't delete, try again later."});
        } 
        else {
            if (data.admin) {
                const id = req.params.id;

                function callback(err, data) {
                    if (err) res.status(404).json({msg:"Error while getting workout data.", err:err});
                    else processData(res, data);
                }

                UserData.getAllAttempts(id, callback);
            }
            else {
                res.status(401).json({msg:"Unauthorized access."});
            }
        }
    });
});

app.get('/api/checkToken', withAuth, function(req, res) {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);
    
    Users.findByEmail(email, function(err, data) {
        data ? res.status(200).json({
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            isAdmin: data.admin,
            id: data._id
        }) : console.log("oops");
    });
});

app.post('/api/run', withAuth, function(req, res){
    var code = req.body.code;
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    // UserData.getAttempts(email, req.body.id, (err, data) => {
    //     if (err | !data) {
    //         Data.findByID(req.body.id, (err, data) => {
    //             if (data && data.code === code && data.defaultOutput != '') {
    //                 res.status(200).json({output:data.defaultOutput, attempts:0});
    //             }
    //             else {
    //                 console.log("!default");
    //                 writeScript(email, req.body.id, unescape(code), req, res);
    //             }
    //         }); 
    //     }
    //     else {
    //         console.log("default");
    //         writeScript(email, req.body.id, unescape(code), req, res);
    //     }
    // });

    writeScript(email, req.body.id, unescape(code), req, res);
    
});

// User Data

app.get("/api/user/data/:id", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        if (data) {
            data = {
                code: data.attempts[data.attempts.length-1].code,
                attempts: data.attempts.length,
                complete: data.complete,
                output: data.attempts[data.attempts.length-1].output
            }
        }
        res.status(200).json({data: data});
    }

    var data = {
        id: req.params.id
    };

    UserData.getAttempts(email, data.id, callback);
});

app.get("/api/attempts/:id", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        else {
            res.status(200).json({data: data});
        }
        
    }

    var data = {
        id: req.params.id
    };

    UserData.getAllAttempts(data.id, callback);
});

app.post("/api/user/data/:id", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    var data = {
        email: req.params.email,
        id: req.params.id,
        attempt: req.body
    };

    UserData.addAttempt(email, data.id, data.attempt, callback);
});

app.delete("/api/user/data/:id", withAuth, (req, res) => {

    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    var data = {
        id: req.params.id,
    };

    UserData.deleteProblem(email, data.id, callback);
});

app.post("/api/submit", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    var data = {
        email: email,
        id: req.body.id
    };

    UserData.completeProblem(data.email, data.id, req.body.studentMsg, callback);
});

app.post("/api/user/utorids", withAuth, (req, res) => {
    var token = req.headers.cookie.split("=")[1];
    var decoded = jwt.verify(token, process.env.SECRET);
    var email = decode(decoded.emailhash);

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        console.log(data);
    }

    console.log(req.body);
    const data = req.body;
    console.log("\n\n", data);

    data.forEach(item => {
        var email = item.email;
        var utorid = item.utorid;

        Users.addUtorID({email: email}, utorid, callback);

    });
    res.status(200).json({data: "Updating data!"});
});

app.get("/api/errors/:error", withAuth, (req, res) => {

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        else
            res.status(200).json({data:data});
    }


    Errors.findByError(req.params.error, callback);
});

app.post("/api/errors", withAuth, (req, res) => {

    function callback(err, data) {
        if (err) res.status(404).json({msg:"Error while getting data.", err:err});
        res.status(200).json({data: data});
    }

    Errors.createError(req.body, callback);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
