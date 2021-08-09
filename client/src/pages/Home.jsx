import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import "./style/Home.css";

import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';

class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            msg: "",
            isLoggedIn:false,
            loading:true,
            firstname: '',
            lastname: '',
            isAdmin: '',
            id:'',
            parentSet: false
        };
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
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
                    msg: "USER LOGGED IN!",
                    isLoggedIn:true,
                    loading:false
                });
                //return res.body();
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
            console.log(data);
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

    componentDidUpdate() {
        
    }

    onSubmit = (event) => {
        event.preventDefault();
    }

    render() {

        var page = (<div>LOADING...</div>);
        page = this.state.loading ? page: !this.state.isLoggedIn ? <Landing /> : <Dashboard />;
        
        return (
            page
        );
      }
    
}

export default withRouter(Home);