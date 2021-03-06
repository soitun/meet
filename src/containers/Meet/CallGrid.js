import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';

import renderIf from 'render-if';

import posed from 'react-pose';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

import AudioVideo from '../../components/AudioVideo';

import FloatingAudioVideo from './FloatingAudioVideo';

const DragableFloatingAudioVideo = posed(React.forwardRef(function DragableFloatingAudioVideo(props, ref) {
  return <FloatingAudioVideo {...props} hostRef={ref}/>;
}))({
  draggable: true,
});

const styles = theme => ({
  root: {
    position: 'relative',
    display: 'flex',
    '& ::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
  common: {
    overflowY: 'overlay',
    overflowX: 'hidden',
  },
  videocall: {
    display: 'grid',
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
    color: theme.palette.primary.contrastText,
    flex: 1,
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(50%, 1fr) ) ;',
    },
    [theme.breakpoints.up('xl')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  call: {
    display: 'grid',
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
    color: theme.palette.primary.contrastText,
    flex: 1,
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(50%, 1fr) ) ;',
    },
    [theme.breakpoints.up('xl')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  cols3: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  overlay: {
    alignContent: 'start',
    justifyContent: 'space-evenly',
    gridTemplateColumns: 'unset',
    minHeight: 0,
    minWidth: 0,
    overflowY: 'overlay',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  standby: {
    flex: '1',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'white',
  },
  container: {
    position: 'relative',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    minHeight: 68,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  rounded: {
    width: '12vh',
    height: '12vh',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    minWidth: 100,
    minHeight: 100,
    maxWidth: '12vh',
    maxHeight: '12vh',
  },
  floatingLocal: {
    position: 'absolute',
    right: theme.spacing(2),
    bottom: theme.spacing(4),
    zIndex: 5,
    minHeight: 100,
    minWidth: 100,
    boxShadow: theme.shadows[6],
  },
  floatingOverlay: {
    maxWidth: 112,
    maxHeight: 112,
    right: 0,
    left: 0,
    margin: '0 auto',
  },
});

class CallGrid extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      mode,
      variant,
      muted,
      cover,
      labels,
      localStream,
      remoteStreamsKey,
      remoteStreams,
      maxVideoStreams,
      audioSinkId,
      AudioVideoProps,
      intl, // eslint-disable-line no-unused-vars
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const streams = [];
    if (remoteStreams.length === 0 && localStream) {
      streams.push({
        id: '',
        stream: localStream,
        muted: true,
        mirrored: true,
      });
    } else {
      remoteStreams.map(stream => {
        const s = stream[remoteStreamsKey];
        streams.push({
          ...stream,
          stream: s, // Use as stream whatever the key says.
        });
        return true;
      });
    }

    let renderMode = mode;
    if (remoteStreams.length > maxVideoStreams) {
      // Force audio mode when too many streams.
      renderMode = 'call';
    }

    const overlay = variant === 'overlay';

    return (
      <div className={className} {...other}>
        {renderIf(renderMode === 'videocall')(() => (
          <div className={classNames(
            classes.common,
            classes.videocall,
            {
              [classes.cols3]: !overlay && streams.length > 10,
              [classes.overlay]: overlay,
            }
          )}>
            {streams.map((stream) =>
              <div
                key={stream.id}
                className={classNames(
                  classes.container,
                  {
                    [classes.rounded]: overlay,
                  }
                )}
              >
                <AudioVideo
                  id={stream.id}
                  muted={muted || stream.muted}
                  mirrored={stream.mirrored}
                  cover={cover}
                  stream={stream.stream}
                  round={!!overlay}
                  user={labels ? stream.user : undefined}
                  calling={stream.calling}
                  audioSinkId={audioSinkId}
                  {...AudioVideoProps}
                  className={classNames(classes.video, AudioVideoProps.className)}
                >
                </AudioVideo>
              </div>
            )}
          </div>
        ))}
        {renderIf(renderMode === 'call')(() => (
          <Grid className={classNames(
            classes.common,
            classes.call,
          )} container alignItems="center" direction="row" justify="center">
            {streams.map((stream) =>
              <AudioVideo
                key={stream.id}
                audio
                id={stream.id}
                muted={muted || stream.muted}
                cover={cover}
                stream={stream.stream}
                user={stream.user}
                calling={stream.calling}
                audioSinkId={audioSinkId}
              >
              </AudioVideo>
            )}
          </Grid>
        ))}
        {renderIf(renderMode === 'standby')(() => (
          <Grid className={classes.standby} container alignItems="center" direction="row" justify="center">
            <Grid item>
              <Typography color="inherit" variant="h5">
                <FormattedMessage id="callGrid.suspended.headline" defaultMessage="Suspended"></FormattedMessage>
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Slide direction="up" in={remoteStreams.length > 0 && !!localStream} mountOnEnter unmountOnExit>
          <DragableFloatingAudioVideo
            className={classNames(classes.floatingLocal, {
              [classes.floatingOverlay]: overlay,
            })}
            stream={localStream}
            mirrored
            muted
            cover={cover}
          />
        </Slide>
      </div>
    );
  }
}

CallGrid.defaultProps = {
  localStream: null,

  remoteStreamsKey: 'stream',
  maxVideoStreams: 20,
  variant: 'full',

  labels: true,

  AudioVideoProps: {},
};

CallGrid.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  mode: PropTypes.oneOf(['videocall', 'call', 'standby']).isRequired,
  variant: PropTypes.oneOf(['full', 'overlay']).isRequired,

  cover: PropTypes.bool,
  muted: PropTypes.bool,
  labels: PropTypes.bool,

  localStream: PropTypes.object,
  remoteStreamsKey: PropTypes.string.isRequired,
  remoteStreams: PropTypes.array.isRequired,

  audioSinkId: PropTypes.string,

  maxVideoStreams: PropTypes.number.isRequired,

  AudioVideoProps: PropTypes.object,
};

export default withStyles(styles)(injectIntl(CallGrid));
