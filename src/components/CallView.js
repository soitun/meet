import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Tabs, { Tab } from 'material-ui/Tabs';
import VideocallIcon from 'material-ui-icons/Videocam';
import CallIcon from 'material-ui-icons/Call';
import RoomIcon from 'material-ui-icons/Group';
import SearchIcon from 'material-ui-icons/Search';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { InputAdornment } from 'material-ui/Input';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import HangupIcon from 'material-ui-icons/CallEnd';
import red from 'material-ui/colors/red';

import renderIf from 'render-if';

import { fetchContacts, addContacts } from '../actions/contacts';
import { setLocalStream, doCall, doHangup } from '../actions/kwm';
import { requestUserMedia, userMediaAudioVideoStream } from '../actions/usermedia';
import CallGrid from './CallGrid';
import IncomingCallDialog from './IncomingCallDialog';

const styles = theme => ({
  root: {
    height: '100vh',
    position: 'relative',
  },
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    height: 0,
  },
  controlsMiddle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.unit * 4,
    zIndex: 5,
    display: 'flex',
    justifyContent: 'center',
  },
  hangupButton: {
    backgroundColor: red[500],
    color: 'white',
    '&:hover': {
      backgroundColor: red[700],
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: red[700],
      },
    },
  },
  call: {
    height: '60vh',
    background: '#ddd',
    minHeight: 100,
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: theme.transitions.create('height', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  callWithCall: {
    height: '100vh',
  },
  menu: {
    boxSizing: 'border-box',
    height: 0,
    flex: 1,
  },
  tabs: {
    flexGrow: 1,
  },
  tab: {
    maxWidth: 70,
    minWidth: 70,
  },
  search: {
    margin: '0 auto',
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
  },
  contacts: {
    margin: '0 auto',
    maxWidth: 600,
    width: '100%',
    height: 'calc(100% - 140px)',
    overflow: 'auto',
  },
});

class CallView extends React.PureComponent {
  state = {
    mode: 'videocall',
  };

  componentDidMount() {
    const { fetchContacts } = this.props;
    const { mode } = this.state;
    fetchContacts().catch(() => {
      // Ignore errors here, let global handler do it.
    });

    this.requestUserMedia(mode);
  }

  handleModeChange = (event, mode) => {
    this.setState({
      mode,
    });
    this.requestUserMedia(mode);
  };

  handleContactsClick = (event) => {
    const { doCall } = this.props;

    if (event.target !== event.currentTarget) {
      // Climb the tree.
      let elem = event.target;
      let row = null;
      for ( ; elem && elem !== event.currentTarget; elem = elem.parentNode) {
        row = elem;
      }

      // Contact id is Base64 URL encoding. Simple conversion here. See
      // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
      const id = row.getAttribute('data-contact-id').replace(/-/g, '+').replace(/_/, '/');

      doCall(id);
    }
  };

  handleHangupClick = () => {
    const { doHangup } = this.props;

    doHangup();
  };

  requestUserMedia = (mode) => {
    const { requestUserMedia } = this.props;

    let video = false;
    let audio = false;
    switch (mode) {
      case 'videocall':
        video = true; // eslint-disable-line no-fallthrough
      case 'call':
        audio = true;
        break;
      default:
        throw new Error('unknown mode');
    }

    return requestUserMedia(video, audio);
  };

  render() {
    const { classes, contacts, channel, ringing } = this.props;
    const { mode } = this.state;

    const callClassName = classNames(
      classes.call,
      {
        [classes.callWithCall]: !!channel,
      },
    );

    let controls = null;
    let menu = null;
    let dialogs = [];
    if (channel) {
      controls = (
        <div className={classes.controls}>
          <div className={classes.controlsMiddle}>
            <Button
              variant="fab"
              color="inherit"
              aria-label="hangup"
              className={classes.hangupButton}
              onClick={this.handleHangupClick}
            >
              <HangupIcon />
            </Button>
          </div>
        </div>
      );
    } else {
      menu = (
        <div className={classes.menu}>
          <AppBar position="static" color="inherit" elevation={0}>
            <Toolbar>
              <Tabs
                value={mode}
                onChange={this.handleModeChange}
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab value="videocall" className={classes.tab} icon={<VideocallIcon />} />
                <Tab value="call" className={classes.tab} icon={<CallIcon />} />
                <Tab value="room" className={classes.tab} icon={<RoomIcon />} disabled />
              </Tabs>
            </Toolbar>
          </AppBar>
          <List className={classes.search} disablePadding>
            <ListItem>
              <TextField
                fullWidth
                autoFocus
                disabled
                placeholder="Search by name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </ListItem>
          </List>
          {renderIf(mode === 'videocall' || mode === 'call')(() => (
            <div className={classes.contacts}>
              <List disablePadding onClick={this.handleContactsClick}>
                {contacts.map((contact) =>
                  <ListItem button data-contact-id={contact.id} key={contact.id}>
                    <Avatar>{contact.displayName.substr(0, 2)}</Avatar>
                    <ListItemText primary={contact.displayName} secondary={contact.userPrincipalName} />
                  </ListItem>
                )}
              </List>
            </div>
          ))}
        </div>
      );
    }

    if (ringing) {
      for (const id in ringing) {
        const record = ringing[id];
        dialogs.push(
          <IncomingCallDialog
            open={!record.ignore}
            key={id}
            record={record}
          >
          </IncomingCallDialog>
        );
      }
    }

    return (
      <div className={classes.root}>
        {controls}
        <div className={classes.container}>
          <CallGrid className={callClassName} mode={mode} />
          {menu}
        </div>
        {dialogs}
      </div>
    );
  }
}

CallView.propTypes = {
  classes: PropTypes.object.isRequired,

  contacts: PropTypes.array.isRequired,
  channel: PropTypes.string,

  fetchContacts: PropTypes.func.isRequired,
  requestUserMedia: PropTypes.func.isRequired,
  doCall: PropTypes.func.isRequired,
  doHangup: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { sorted: sortedContacts } = state.contacts;
  const { user } = state.common;
  const { channel, ringing } = state.kwm;

  // Base64 URL encoding required, simple conversion here. See
  // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
  const subURLSafe = user.profile.sub.replace(/\+/g, '-').replace(/\//, '_');

  // Filter self from contacts.
  const sortedContactsWithoutSelf = sortedContacts.filter(contact => {
    const res = contact.id !== subURLSafe;
    return res;
  });

  return {
    contacts: sortedContactsWithoutSelf,
    channel,
    ringing,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchContacts: async () => {
      const contacts = await dispatch(fetchContacts());
      await dispatch(addContacts(contacts.value));
    },
    requestUserMedia: async (video=true, audio=true) => {
      const stream = await dispatch(requestUserMedia('main', video, audio));
      dispatch(setLocalStream(stream));
      dispatch(userMediaAudioVideoStream(stream));
    },
    doCall: async(id) => {
      await dispatch(doCall(id));
    },
    doHangup: async() => {
      await dispatch(doHangup());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(CallView));
