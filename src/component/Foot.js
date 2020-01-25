import React, {useEffect, useRef, useState} from 'react';
import Share from "./Share";
import ContentEditable from "./ContentEditable";
import DataStore from "../util/dataStore";
import Storage from "../util/storage.js";
import Auth from "../util/auth.js";
import toName from "../util/toName";
import './Foot.css';

export default function Foot(props) {

  /** @type {{current: ElementContentEditable}} */ const inputField = useRef(null);

  const [field, setField] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const documentKeydownHandler = e => {
      if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
      return inputField.current.focus();
    };
    document.addEventListener('keydown', documentKeydownHandler);
    return () => document.removeEventListener('keydown', documentKeydownHandler);
  });

  useEffect(() => {
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        props.chatEl.current.classList.remove('scrollSmooth');
        props.scrollToBottom();
      });
      resizeObserver.observe(props.chatBodyEl.current);
      return () => resizeObserver.disconnect();
    } else {
      const onFocusListener = () => {
        window.isMobileJustDevice().then(isMobile => {
          if (!isMobile) return;
          props.chatEl.current.classList.remove('scrollSmooth');
          props.scrollToBottom();
        });
      };
      const inputFieldRef = inputField.current;
      inputFieldRef.addEventListener('focus', onFocusListener);
      return () => inputFieldRef.removeEventListener('focus', onFocusListener);
    }
  }, [props, props.scrollToBottom]);


  const onSubmit = async e => {
    e.preventDefault();
    if (files.length) {
      Array.from(files).forEach(f =>
        (async () => {
          DataStore.sendMessage({
            from: (await Auth.current()).uid,
            to: props.otherUser,
            body: null,
            image: (await Storage.upload(f, props.otherUser)).ref.name
          })
        })());

    }
    if (!field.trim()) return;
    const payload = {
      from: props.currentUser.uid,
      to: props.otherUser,
      body: field.trim()
    };
    setField('');
    inputField.current.focus();
    try {
      await DataStore.sendMessage(payload);
    } catch (e) {
      alert(`Sending message “${payload.message}” to ${toName(props.otherUser, props.names)} failed.\n\n${e}`);
    }
  };

  const onInputFieldResize = height => {
    if (!props.chatBodyEl.current) return;
    props.chatBodyEl.current.style.marginBottom = height + 'px';
    props.chatEl.current.classList.remove('scrollSmooth');
    props.scrollToBottom();
  };

  return (
    <form onSubmit={onSubmit}>
      <Share onFiles={setFiles}/>
      <ContentEditable
        onChange={e => setField(e.target.value)}
        onResize={onInputFieldResize}
        placeholder="Type here"
        value={field}
        ref={inputField}
        files={files}
        required/>
      <button type="submit"
              className="submit"
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSubmit(e)}>
        &#10003;
      </button>
    </form>
  )
};