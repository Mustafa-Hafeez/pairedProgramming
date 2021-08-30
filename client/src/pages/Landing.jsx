import React, { Component } from 'react';
import "./style/Home.css";

class Landing extends Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }

    componentDidMount() {
        
        
    }

    onSubmit = (event) => {
        event.preventDefault();
    }

    render() {
        return (

            <div className="page">
                Welcome to PyBuggy!
                <h4>Log in or register to get started 🐞</h4>
            </div>
        );
      }
    
}

export default Landing;