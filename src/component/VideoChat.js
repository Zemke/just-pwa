import React, {useEffect, useRef, useState} from "react";
import './Camera.css';
import './VideoChat.css';
import Overlay from "./Overlay";
import Peering from '../util/peering';
import getUserMedia from '../util/getUserMedia';
import toName from '../util/toName';
import DataStore from '../util/dataStore';
import Close from "./Close";

export default function VideoChat(props) {

  /** @type {{current: HTMLVideoElement}} */ const videoElem = useRef(null);
  /** @type {{current: HTMLDivElement}} */ const cameraContainerElem = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [names] = useState(DataStore.getCachedNames);
  const [requestCallFailure, setRequestCallFailure] = useState(null);

  const displayStream = async stream => {
    (cameraContainerElem.current
      && cameraContainerElem.current.classList.add('onVideo'));
    videoElem.current.srcObject = stream;
    await videoElem.current.play();
    setPlaying(true);
    return stream;
  };

  useEffect(() => {
    if (!props.stream) return;
    let videoTrack;
    (async () => videoTrack = (await displayStream(props.stream)).getVideoTracks()[0])();
    return () => videoTrack && videoTrack.stop();
  }, [props.stream]);

  useEffect(() => {
    if (props.stream || !props.otherUser) return;

    let videoTrack;
    (async () => {
      const ownStream = await getUserMedia();
      try {
        const otherStream = await Peering.requestCall(props.otherUser, ownStream);
        videoTrack = (await displayStream(otherStream)).getVideoTracks()[0];
      } catch (e) {
        setRequestCallFailure(e);
      }
    })();
    return () => videoTrack && videoTrack.stop();
  }, [props.stream, props.otherUser]);

  // todo mic and cam toggle buttons
  // todo hang up button

  return (
    <Overlay onClose={props.onClose}>
      {!playing ? (
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
                <span className="video-chat-blink" role="img" aria-label="calling">
                  📞
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div id="cameraContainer"
             ref={cameraContainerElem}
             tabIndex="10">
          <div className="videoWrapper">
            <video id="video" ref={videoElem}/>
          </div>
        </div>
      )}
    </Overlay>
  );
};
