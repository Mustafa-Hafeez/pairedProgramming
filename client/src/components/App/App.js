import React, { Component } from "react";
import { Link, Route, Switch, BrowserRouter } from 'react-router-dom';
import "../../pages/style/Home.css";

import Home from '../../pages/Home';
import Login from '../../pages/Login';
import Registration from '../../pages/Registration';
import Logout from '../../pages/Logout';
import Stats from '../../pages/Stats';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            isAdmin: false,
            items: {},
            isLoggedIn:false,
            firstname: '',
            lastname: '',
            id:'',
            refreshed: true
        };

        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.setName = this.setName.bind(this);
        this.setAdmin = this.setAdmin.bind(this);
        this.setId = this.setId.bind(this);
    }

    login() {
        this.setState({isLoggedIn: true});
    }

    logout() {
        this.setState({isLoggedIn: false});
    }

    setName(name) {
        this.setState(name);
    }

    setId(id) {
        this.setState({id:id});
    }

    setAdmin(isAdmin) {
        this.setState({isAdmin: isAdmin});
    }

    componentDidMount() {
        fetch('/api/checkToken', {
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                this.setState({
                    msg: "USER LOGGED IN!",
                    isLoggedIn:true,
                    loading:false
                });
                return res.json();
            } else {
                this.setState({
                    msg: "PLEASE LOGIN FIRST.",
                    isLoggedIn:false,
                    loading:false
                });
            }
        })
        .then(data => {
            if (data) {
                //console.log(data);
                this.setState({
                    firstname: data.firstname,
                    lastname: data.lastname
                });
                this.setState({isAdmin: data.isAdmin});
                this.setState({id:data.id});
            }
            
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
        
    }

    render() {
        var loginButton = this.state.isLoggedIn ? (<div className='nav-item'><Link to="/logout">Logout</Link></div>) : (
        <div>
            <div className='nav-item'><Link to="/login">Login</Link></div>
            <div className='nav-item'><Link to="/register">Register</Link></div></div>
        );

        return (
            <BrowserRouter>
                <div className='container'>
                    <div className='nav'>
                        <div className='logo'>PyBuggy</div>
                        <div className='nav-cont'>
                            {this.state.id !== '' ? <div className='firstname'>Welcome,&nbsp;&nbsp;<div className="lastname">{this.state.firstname} {this.state.lastname}</div></div> : ''}
                            {/* {this.state.id !== '' ?
                                <div className='userID'>ID: <span className='highlight'>{this.state.id}</span></div>
                            :
                                <span></span>
                            } */}
                            {this.state.isAdmin ?
                                <div className='admin-tag'>A</div>
                            :
                                <span></span>
                            }
                            <div className='nav-item'><Link to="/">Home</Link></div>
                            {this.state.isAdmin ?
                                <div className='nav-item'><Link to="/stats">Stats</Link></div>
                            :
                                <span></span>
                            }
                            {loginButton}
                        </div>
                    </div>
                    <div className='content'>
                        <Switch>
                            <Route exact path="/" component={() => <Home login={this.login} logout={this.logout} setName={this.setName} setAdmin={this.setAdmin} setId={this.setId}/>} />
                            <Route exact path="/login" component={() => <Login login={this.login} logout={this.logout}  setName={this.setName} setAdmin={this.setAdmin} setId={this.setId}/>} />
                            <Route exact path="/logout" component={() => <Logout login={this.login} logout={this.logout}  setName={this.setName} setAdmin={this.setAdmin} setId={this.setId}/>}/>
                            <Route exact path="/register" component={() => <Registration login={this.login} logout={this.logout} setName={this.setName} setAdmin={this.setAdmin} setId={this.setId}/>} />
                            <Route exact path="/stats" component={() => <Stats login={this.login} logout={this.logout} setName={this.setName} setAdmin={this.setAdmin} setId={this.setId}/>} />
                            
                        </Switch>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;