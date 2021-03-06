import React, {useEffect, useRef, useState} from "react";
import './Camera.css';
import './VideoChat.css';
import Overlay from "./Overlay";
import Peering from '../util/peering';
import getUserMedia from '../util/getUserMedia';
import toName from '../util/toName';
import DataStore from '../util/dataStore';

export default function VideoChat(props) {

  /** @type {{current: HTMLVideoElement}} */ const videoElem = useRef(null);
  /** @type {{current: HTMLVideoElement}} */ const ownVideoElem = useRef();
  /** @type {{current: MediaStream}} */ const ownMediaStream =
    useRef(props.ownStream ? props.ownStream.stream : null);
  /** @type {{current: Function}} */ const hangUpCb =
    useRef(props.ownStream ? props.ownStream.hangUpCb : null);

  const [playing, setPlaying] = useState(false);
  const [names] = useState(DataStore.getCachedNames);
  const [requestCallFailure, setRequestCallFailure] = useState(null);
  const [hangingUp, setHangingUp] = useState(false);
  const [camToggle, setCamToggle] = useState(true);
  const [micToggle, setMicToggle] = useState(true);

  const displayStream = stream => {
    videoElem.current.srcObject = stream;
    videoElem.current.play().then(() => setPlaying(true));
  };

  const displayOwnStream = () => {
    console.log(ownMediaStream.current);
    ownVideoElem.current.srcObject = ownMediaStream.current;
    ownVideoElem.current.play();
  };

  useEffect(() => {
    if (!props.stream) return;
    props.stream.getTracks().forEach(track =>
      track.onended = () =>
        setTimeout(() => props.onClose(), 1000));
    displayStream(props.stream);
    displayOwnStream();
  }, [props]);

  useEffect(() => {
    if (props.stream || !props.otherUser) return;
    (async () => {
      ownMediaStream.current = await getUserMedia();
      displayOwnStream();
      try {
        const otherStream =
          await Peering.requestCall(
            props.otherUser, ownMediaStream.current,
            () => setTimeout(() => props.onClose(), 1000));
        hangUpCb.current = otherStream.hangUpCb;
        displayStream(otherStream.stream);
      } catch (e) {
        setRequestCallFailure(e);
        setTimeout(() => props.onClose(), 1000);
      }
    })();
  }, [props]);

  const hangUp = () => {
    setHangingUp(true);
    hangUpCb.current();
    setTimeout(() => props.onClose(), 1000);
  };

  const toggleCamera = () => {
    ownMediaStream.current
      .getVideoTracks()
      .forEach(track => track.enabled = !track.enabled);
    setCamToggle(!!ownMediaStream.current.getVideoTracks().find(t => t.enabled))
  };

  const toggleMute = () => {
    ownMediaStream.current
      .getAudioTracks()
      .forEach(track => track.enabled = !track.enabled);
    setMicToggle(!!ownMediaStream.current.getAudioTracks().find(t => t.enabled))
  };

  return (
    <Overlay onClose={props.onClose}>
      {!playing && (
        <div className="translucent translucent-center text-center">
          {requestCallFailure ? (
            <>
              <span className="text-large">{toName(props.otherUser, names)}</span><br/>
              {requestCallFailure === 'timeout' && 'didn’t pick up'}
              {requestCallFailure === 'rejected' && 'rejected the call'}
              <div className="margin-top">
                <span role="img" aria-label="call failure">
                  🚫
                </span>
              </div>
            </>
          ) : (
            <>
              Calling<br/>
              <span className="text-large">{toName(props.otherUser, names)}</span><br/>
              <div className="margin-top">
                <span className="blink" role="img" aria-label="calling">
                  📞
                </span>
              </div>
              <div className="margin-top">
                <div>
                  <button className="form-control" onClick={props.onClose}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <div id="cameraContainer"
           className={playing ? 'onVideo' : ''}
           tabIndex="10">
        <div className="videoWrapper">
          <video id="video" ref={videoElem}/>
          <video id="ownVideo" ref={ownVideoElem}/>
        </div>
      </div>
      {playing && (
        <div className="controls">
          <div className="margin-top text-center">
            <button className="form-control circle" aria-label="Mute" onClick={toggleMute}>
              {!micToggle && (<div className="cross-disabled r1"/>)}
              <span role="img" aria-label="Microphone">🎙</span>
            </button>
            <button className="form-control circle" aria-label="Mute" onClick={toggleCamera}>
              {!camToggle && (<div className="cross-disabled r2"/>)}
              <span role="img" aria-label="Camera">📽</span>
            </button>
            <button className="form-control circle hang-up" onClick={hangUp} disabled={hangingUp}>
              <span role="img" aria-label="phone">📞</span>
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
};
