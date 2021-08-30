import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import "./style/Home.css";

class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            user : '',
            password: '',
            isLoggedIn: false
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
        fetch('/api/signin', {
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.status === 200) {
                this.props.login();
                this.props.history.push('/');
                return res.json();
            } else {
                console.log(res);
                const error = new Error(res.error);
                throw error;
            }
        })
        .then(data => {
            this.props.setName(data);
            this.props.setAdmin(data.isAdmin);
            this.props.setId(data.id);
        }) 
        .catch(err => {
            console.error(err);
            alert('Error logging in please try again');
        });
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
                    isLoggedIn:true
                });
                return res.json();
            } else {
                this.setState({
                    isLoggedIn:false
                });
            }
        })
        .then(data => {
            console.log(data);
        }) 
        .catch(err => {
            console.error(err);
            alert('Error checking token');
        });
        
    }

    render() {
        var loginForm = (<form onSubmit={this.onSubmit}>
            <h1>Log in to <b>PyBuggy</b>:</h1>
            <input 
                className="username"
                type="text"
                name="user"
                placeholder="Email or Username"
                value={this.state.user}
                onChange={this.handleInputChange}
                required
            />
            <input
                className="password"
                type="password"
                name="password"
                placeholder="Enter password"
                value={this.state.password}
                onChange={this.handleInputChange}
                required
            />
            <input className="submit" type="submit" value="Submit"/>
        </form>);
        var page = this.state.isLoggedIn ? this.props.history.push('/') : loginForm;
        return (
            page
        );
      }
    
}

export default withRouter(Login);