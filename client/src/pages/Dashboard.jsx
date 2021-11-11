import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Badge from 'react-bootstrap/Badge'
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-xcode";

import "./style/Home.css";
import "./style/Dashboard.css";

class Dashboard extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isAdmin: false,
            problems: [],
            error: false,
            active:'',
            currentProblem:{
                name:'',
                description: '',
                code:'# Survey: bit.ly/A20prev'
            },
            output:'',
            currentAttempts:0,
            creatingProblem: false,
            canSubmit: false,
            canRun: false,
            password: '',
            time: 0,
            problemComplete: false,
            runcount : 0,
            currentErrors:[],
            running: true
        };
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }

    componentDidMount() {
        fetch('/api/problems', {
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                return res.json()
            } else {
                this.setState({
                    error:true
                });
            }
        })
        .then(data => {
            var probs = data.data;
            probs.forEach(p => p.code = unescape(p.code));

            this.setState({problems:probs});
        })
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
        
        fetch('/api/checkToken', {
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                
                return res.json();
            }
        })
        .then(data => {
            if (data) {
                this.setState({isAdmin: data.isAdmin});
            }
            
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
    }

    onSubmit = (event) => {
        event.preventDefault();
    }

    chooseProblem = (id, name, desc, code, output, creatingProblem) => {
        this.setState({
            active:id, 
            currentProblem:{
                name:name,
                description:desc,
                code:code
            },
            creatingProblem: creatingProblem,
            time: new Date(),
            canSubmit:false,
            runcount:0,
            currentAttempts:0,
            output:output,
            canRun:false,
            currentErrors:[],
            running: false,
            problemComplete: false
        });

        fetch('/api/user/data/' + id, {
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                return res.json();
            }
        })
        .then(data => {
            if (data.data != null) {
                var curr = this.state.currentProblem;
                curr.code = unescape(data.data.code);
                this.setState({currentProblem: curr, problemComplete: data.data.complete, currentAttempts:data.data.attempts, output: unescape(data.data.output)});
            }
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
    }

    createProblem = () => {
        if (this.state.canSubmit) {

            var password = prompt("Enter your password");
            var code = this.state.currentProblem.code;
            code = escape(code);

            fetch('/api/problems', {
                method: 'POST',
                body: JSON.stringify({
                    name: this.state.currentProblem.name,
                    description: this.state.currentProblem.description,
                    code: code,
                    password:password,
                    defaultOutput: this.state.output
                }),
                headers: {
                    'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    const error = new Error(res.error);
                    throw error;
                }
            })
            .then(data => {
                console.log(data);
                window.location.reload();
            }) 
            .catch(err => {
                console.error(err);
                alert('Error logging in please try again');
            });
        }
        else {
            alert("Run your code first!");
        }
    }

    deleteProblem = (id) => {
        var password = prompt("Enter your password");
        fetch('/api/problems', {
            method: 'DELETE',
            body: JSON.stringify({id:id, password:password}),
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                return res.json();
            } else {
                console.log(res);
                const error = new Error(res.error);
                throw error;
            }
        })
        .then(data => {
            console.log(data);
            window.location.reload();
        }) 
        .catch(err => {
            console.error(err);
            alert('Error logging in please try again');
        });
    }

    submitCode = (id) => {
        if (this.state.canSubmit) {
            let isPair = false;
            var getPair = prompt("Did you work in a pair today? Type 'Y' for yes, anything else for no.", "Y");
            let partnerNum = 0;
            switch(getPair) {
              case "Y":
                isPair = true;
                break;
              default:
                isPair = false;
            }
            if (isPair) {
                partnerNum = prompt("So you worked in a pair... Please enter your partner's student number.");
            }
            if (partnerNum >= 0) {
                fetch('/api/submit', {
                    method: 'POST',
                    body: JSON.stringify({id: id, isPair: isPair, pairNum: partnerNum}),
                    headers: {
                        'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => {
                    if (res.status === 200) {
                        return res.json();
                    } else {
                        const error = new Error(res.error);
                        throw error;
                    }
                })
                .then(data => {
                    this.setState({problemComplete: true});
                }) 
                .catch(err => {
                    console.error(err);
                    alert('Error logging in. Please try again.');
                });
            }
            else {
                alert("Please enter a valid student number.");
            }
        }
        else {
            alert("Run your code first!");
        }
    }


    onChangeCode = (e) => {

        var curr = this.state.currentProblem;
        curr.code = e;
        this.setState({currentProblem: curr, canSubmit: this.state.runcount > 0, canRun: true});
    }

    onPassword = (e) => {
        this.setState({password:e.target.value});
    }

    onChangeTitle = (e) => {
        var curr = this.state.currentProblem;
        curr.name = e.target.value;

        this.setState({currentProblem: curr});

    }

    onChangeDescription = (e) => {
        var curr = this.state.currentProblem;
        curr.description = e.target.value;

        this.setState({currentProblem: curr});
    }

    onChangeConsole = (e) => {
        console.log(e);
        this.setState({output: e})
    }

    runCode = (id) => {
        if (!this.state.canRun) {
            alert("Change the code before running!");
        }
        else {
            console.log(this.state.currentProblem.code.match(/(input\((.*)\))/g));
            var detectInput = this.state.currentProblem.code.match(/(input\((.*)\))/g) != null;
            var detectImport = this.state.currentProblem.code.includes("import");
            
            if (detectInput || detectImport) {
                alert("Do not use input(\"...\") OR import!");
            }
            else {
                this.setState({running: true});
                var code = escape(this.state.currentProblem.code);
                var endTime = new Date();
                var timeDiff = endTime - this.state.time; //in ms
                // strip the ms
                timeDiff /= 1000;

                // get seconds 
                var seconds = Math.round(timeDiff);

                this.setState({canSubmit: true, runcount: this.state.runcount + 1});

                fetch('/api/run', {
                    method: 'POST',
                    body: JSON.stringify({id: id, code:code, elapsedTime: seconds}),
                    headers: {
                        'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => {
                    this.setState({running: false});
                    if (res.status === 200) {
                        return res.json();
                    } else {
                        const error = new Error(res.error);
                        throw error;
                    }
                })
                .then(data => {
                    this.setState({output:data.output, currentAttempts: data.attempts});
                }) 
                .catch(err => {
                    console.error(err);
                    alert('Error logging in please try again');
                });
            }
        }
    }

    render() {
        return (
            <div className='dash'>
                <div className='sidemenu dash-item'>
                    <div className="problems-header">Problems</div>
                    {this.state.problems.map(item=>(
                        <Button className='problem' 
                                variant={this.state.active!==item.id ? "outline-dark" : "dark"} 
                                key={item.id}
                                disabled={this.state.active!==item.id ? false : true}
                                onClick={() => {this.chooseProblem(item.id, item.name, item.description, item.code, item.defaultOutput, false)}}>
                            {item.name}
                        </Button>
                    ))}

                    {this.state.isAdmin ? 
                        <Button className='problem' 
                                variant={this.state.active!=="create-problem-button" ? "outline-danger" : "danger"} 
                                key={'create-problem-button'}
                                disabled={this.state.active!=="create-problem-button"? false : true}
                                onClick={() => {this.chooseProblem("create-problem-button",
                                '', '', '', '', true)}}>
                            Add Problem
                        </Button>
                        : <span></span>
                    }
                </div>
                <div className='dash-content dash-item'>
                    <div className="dash-content-item editor-container">
                        <div className='problem-status'>

                            <div className='status-item'> 
                                {this.state.problemComplete ?
                                    <Badge pill variant="success">Complete</Badge>
                                :
                                    <Badge pill variant="primary">Incomplete</Badge>
                                }
                            </div>
                            <div className='status-item'> 
                                {this.state.active !== '' && this.state.running ?
                                    <Badge pill variant="secondary">Running...</Badge>
                                :
                                    <span></span>
                                }
                            </div>
                            {/* <div className='status-item'><Badge variant="light">Attempts <Badge variant="dark">{this.state.currentAttempts}</Badge></Badge></div> */}
                        
                        </div>
                        <AceEditor
                            placeholder="Enter python code"
                            mode="python"
                            theme="solarized_dark"
                            name="editor"
                            className="editor"
                            onLoad={this.onLoad}
                            onChange={this.onChangeCode}
                            fontSize={14}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={this.state.currentProblem.code}
                            height='95%'
                            width='99%'
                            wrapEnabled={true}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: true,
                                tabSize: 4,
                                readOnly: this.state.active === ''
                            }}
                            key={this.state.active + "-editor"}
                            annotations={this.state.currentErrors}
                        />
                    </div>
                    <div className="dash-content-item right-side">
                        <div className="problem-info">
                            {this.state.isAdmin && this.state.creatingProblem ?
                                <Form.Control className='title' type="text" placeholder="Enter problem title" onChange={this.onChangeTitle}/>
                            :
                                <div className='title'>
                                    {this.state.currentProblem.name}
                                </div>
                            }
                            <hr className="problem-divider"></hr>

                            {this.state.isAdmin && this.state.creatingProblem  ?   
                                <Form.Control className='description' as="textarea" rows="3" onChange={this.onChangeDescription}/>
                            :
                                <div className='description'>
                                    {this.state.currentProblem.description}
                                </div>
                            }
                            
                        </div>
                        <div className="console">
                            <AceEditor
                                placeholder=""
                                mode="json"
                                theme="github"
                                name="console"
                                className='console-editor'
                                onLoad={this.onLoad}
                                onChange={this.onChangeConsole}
                                fontSize={12}
                                showPrintMargin={false}
                                showGutter={true}
                                highlightActiveLine={false}
                                value={this.state.output}
                                height='100%'
                                width='100%'
                                wrapEnabled={true}
                                setOptions={{
                                    enableBasicAutocompletion: false,
                                    enableLiveAutocompletion: false,
                                    enableSnippets: false,
                                    showLineNumbers: false,
                                    tabSize: 2,
                                    readOnly: !this.state.creatingProblem
                                }}
                            />
                        </div>

                        <Button className='problem' 
                                variant="outline-secondary"
                                onClick={() => {this.runCode(this.state.active)}}
                                disabled={this.state.running}>
                            Run Code
                        </Button>

                        {this.state.isAdmin && this.state.creatingProblem ?
                            <Button className='problem' 
                                    variant="success" 
                                    onClick={() => {this.createProblem()}}
                                    disabled={this.state.active === ''}>
                                Submit Problem
                            </Button>
                        :
                            <Button className='problem' 
                                    variant="secondary"
                                    onClick={() => {this.submitCode(this.state.active)}}
                                    disabled={this.state.active === '' && this.state.canSubmit === false}>
                                Submit
                            </Button>
                        }

                        {this.state.isAdmin && !this.state.creatingProblem ?
                                <Button className='problem' 
                                        variant="dark" 
                                        onClick={() => {this.deleteProblem(this.state.active)}}
                                        disabled={this.state.active === ''}>
                                    Delete Problem
                                </Button>
                        :
                            <span></span>
                        }
                    </div>
                    
                </div>
            </div>
        );
      }
    
}

export default withRouter(Dashboard);