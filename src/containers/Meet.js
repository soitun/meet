import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import BaseContainer from 'kpop/es/BaseContainer';
import { fetchConfig } from 'kpop/es/config/actions';
import { fetchUser, receiveUser } from 'kpop/es/oidc/actions';
import { setError, userRequiredError } from 'kpop/es/common/actions';

import { HowlingProvider } from '../components/howling';
import soundSprite1Ogg from '../sounds/sprite1.ogg';
import soundSprite1Mp3 from '../sounds/sprite1.mp3';
import soundSprite1Json from '../sounds/sprite1.json';

import { basePath } from '../base';
import Meetscreen  from '../components/Meetscreen';
import { connectToKWM, disconnectFromKWM } from '../actions/kwm';
import { initializeOffline } from '../actions/offline';
import { initializeVisibility } from '../actions/visibility';

const routes = [
  {
    path: '/r/:view(call|conference|group)?',
    exact: false,
    component: Meetscreen,
  },
];

class App extends PureComponent {
  state = {
    initialized: false,
  }

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(initializeVisibility());
    dispatch(initializeOffline());
  }

  componentDidUpdate(prevProps) {
    const { initialized } = this.state;
    const { offline, dispatch } = this.props;

    if (!initialized && offline !== prevProps.offline && !offline) {
      this.initialize().then(() => {
        console.info('app initialized'); // eslint-disable-line no-console
        this.setState({
          initialized: true,
        });
      }).catch(err => {
        console.error('app initialization failed - this is fatal', err); // eslint-disable-line no-console
        dispatch(setError({
          detail: `${err}`,
          message: 'Failed to establish connection',
          fatal: true,
        }));
      }) ;
    }
  }

  initialize = () => {
    const { dispatch } = this.props;

    return dispatch(fetchConfig('meet')).then(config => {
      // Check if user was provided in configuration.
      if (config.user) {
        return dispatch(receiveUser(config.user)).then(() => {
          return config.user;
        });
      } else {
        return dispatch(fetchUser());
      }
    }).then((user) => {
      if (!user) {
        return dispatch(userRequiredError());
      } else {
        return dispatch(connectToKWM());
      }
    });
  }

  render() {
    const { initialized } = this.state;
    const { config, user, ...other } = this.props;
    const ready = config && user && initialized ? true : false;

    const soundSrc = [ soundSprite1Ogg, soundSprite1Mp3 ];
    const soundSprite = soundSprite1Json;

    return (
      <BaseContainer ready={ready} {...other}>
        <HowlingProvider src={soundSrc} sprite={soundSprite}>
          <Router basename={basePath}>
            <Switch>
              {routes.map((route, i) => <Route key={i} {...route} />)}
              <Redirect to="/r" />
            </Switch>
          </Router>
        </HowlingProvider>
      </BaseContainer>
    );
  }
}

App.propTypes = {
  offline: PropTypes.bool.isRequired,
  updateAvailable: PropTypes.bool.isRequired,
  config: PropTypes.object,
  user: PropTypes.object,
  error: PropTypes.object,

  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { offline, updateAvailable, config, user, error } = state.common;

  return {
    offline,
    updateAvailable,
    config,
    user,
    error,
  };
};

export default connect(mapStateToProps)(App);
