import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

import Dropdown from 'react-bootstrap/Dropdown'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Badge from 'react-bootstrap/Badge'
import AceEditor from "react-ace";
import Spinner from 'react-bootstrap/Spinner'

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-xcode";

import "./style/Home.css";
import "./style/Stats.css";
import "./style/Dashboard.css";

class Stats extends Component {

    constructor(props) {
        super(props)
        this.state = {
            problemComplete:false,
            fetching:false,
            problems:[],
            active:'',
            currentProblem:{
                name:'',
                description:'',
                users: []
            },
            code:'',
            console:'',
            email:'',
            user: {
                firstname: '',
                lastname: '',
                id: '',
                type: '',
                totalAttempts: 0
            }
        };
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }

    onSubmit = (event) => {
        event.preventDefault();
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
    }

    selectUser(user, item) {
        console.log(user, item);

        var curr = this.state.currentProblem;
        curr.code = unescape(item.code);
        this.setState({currentProblem: curr, output: unescape(item.output)});
        this.setState({problemComplete: user.complete});

        var cuser = this.state.user;
        cuser.totalAttempts = user.attempts.length;

        this.setState({user:cuser});

        fetch('/api/user/' + user.email, {
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
                var curr = this.state.user;
                curr.firstname = data.data.firstname;
                curr.lastname = data.data.lastname;
                curr.id = data.data["_id"];
                curr.type = data.data.type;
                console.log(data, curr);
                this.setState({user: curr});
            }
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
    }

    chooseProblem = (id, name, desc, code, output, creatingProblem) => {
        this.setState({
            active:id, 
            currentProblem:{
                name:name,
                description:desc,
                code:code,
                users:[]
            }
        });

        fetch('/api/attempts/' + id, {
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
                curr.users = data.data;
                console.log(data);
                this.setState({currentProblem: curr});
            }
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
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

    downloadStats = (id) => {
        this.setState({fetching:true});
        console.log('/api/problems/data/' + id)
        fetch('/api/problems/data/' + id, {
            headers: {
                'Accept':'Content-Type, text/csv, */*',  // It can be used to overcome cors errors
                'Content-Disposition': 'attachment; filename=\"' + 'download-' + Date.now() + '.csv'
            }
        })
        .then(res => {
            this.setState({fetching:false});
            if (res.status === 200) {
                return res.text();
            }
        })
        .then(text => {
            const element = document.createElement("a");
            const file = new Blob([text], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = 'download-' + Date.now() + '.csv';
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
        });
    }

    render() {
        var _downloadBtn = this.state.fetching ?
            <Button className='dropdown-problems' 
                variant="danger" 
                //href={"/api/problems/data/" + this.state.active}
                disabled={this.state.fetching}>
                <span>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        variant="light"
                    />
                    <span className="spacing"></span>
                    Fetching ...
                </span>
            </Button>
        :
            <Button className='dropdown-problems' 
                variant="success" 
                onClick={() => {this.downloadStats(this.state.active)}}
                //href={"/api/problems/data/" + this.state.active}
                disabled={this.state.fetching}>
                Download Stats
            </Button>;
        
        
        var downloadBtn = this.state.active !== '' ? 
            (_downloadBtn)
        :
            <span></span>;
        
        return (
            <div className='dash'>
                <div className='sidemenu dash-item'>
                    <Dropdown className='dropdown-problems'>
                        <Dropdown.Toggle variant="info" className='dropdown-problems-item' id="dropdown-basic">
                            Problems
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {this.state.problems.map(item=>(
                                
                                <Dropdown.Item key={item.id} 
                                            onClick={() => {this.chooseProblem(item.id, item.name, item.description, item.code, item.defaultOutput, false)}}>
                                    {item.name}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    {this.state.currentProblem.users.length == 0 && this.state.active !== '' ?
                        <div>LOADING....</div>
                    :
                        (downloadBtn)
                        
                    }           
                    {this.state.currentProblem.users.map(user=>(
                        
                        <Dropdown className='dropdown-problems dropdown-problems-user'>
                            <Dropdown.Toggle variant="secondary" className='dropdown-problems-item dropdown-problems-item-user' id="dropdown-basic"
                            >
                                {user.email}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="dropdown-menu">
                                {user.attempts.map((item, i)=>(
                                    
                                    <Dropdown.Item key={item.id} 
                                                onClick={() => {this.selectUser(user, item)}}
                                                className="drop-item">
                                        {"Attempt " + i}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    ))}
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
                                    <Badge pill variant="info">Running...</Badge>
                                :
                                    <span></span>
                                }
                            </div>

                            <div className='status-item'> 
                                {this.state.user.firstname}
                            </div>
                            <div className='status-item'> 
                                {this.state.user.lastname}
                            </div>
                            <div className='status-item'> 
                                {"id: " + this.state.user.id}
                            </div>
                            <div className='status-item'> 
                                {"type: " + this.state.user.type}
                            </div>
                            <div className='status-item'> 
                                {"Total Attempts: " + this.state.user.totalAttempts}
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
                                readOnly: true
                            }}
                            key={this.state.active + "-editor"}
                            annotations={this.state.currentErrors}
                        />
                    </div>
                    <div className="dash-content-item right-side">
                        <div className="problem-info">
                            <div className='title'>
                                {this.state.currentProblem.name}
                            </div>
                            <div className='description'>
                                {this.state.currentProblem.description}
                            </div>
                        </div>
                        <div className="console">
                            <AceEditor
                                placeholder=""
                                mode="json"
                                theme="solarized_dark"
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
                                    readOnly: true
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
      }
    
}

export default withRouter(Stats);