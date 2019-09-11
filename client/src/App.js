import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

//Redux
import store from './store';
import { Provider } from 'react-redux';

const App = () => (
  <Provider store={store}>
    <Router>
      <>
        <Navbar />
        <Route exact path="/" component={Landing} />
        <section className="container">
          <Switch>
            <Route exact path="/register" component={Register} />
            <Route exact path="/Login" component={Login} />
          </Switch>
        </section>
      </>
    </Router>
  </Provider>
);

export default App;
