import React, {Fragment, useEffect, useRef, useState} from 'react';
import './Chat.css';
import DataStore from '../util/dataStore';
import ChatMenu from "./ChatMenu";
import ChatSelect from "./ChatSelect";
import MessageUtils from '../util/messageUtils';
import toName from '../util/toName.js';
import Linkify from 'react-linkify';
import messaging from "../util/messaging";
import webNotifications from "../util/webNotification";

export default function Chat(props) {

  const chatEl = useRef(null);
  const inputField = useRef(null);
  const [initMessages, setInitMessages] = useState(false);
  const [field, setField] = useState('');
  const [otherUser, setOtherUser] = useState(() => {
    const otherUserFromPathname = window.location.pathname.substr(1);
    if (!!otherUserFromPathname) {
      const otherUserFromPathnameExists = props.messages.find(
        m => m.from === otherUserFromPathname || m.to === otherUserFromPathname);
      if (otherUserFromPathnameExists) return otherUserFromPathname;
    }
    return MessageUtils.extractOtherUser(props.currentUser.uid, props.messages);
  });
  const [otherUsers, setOtherUsers] = useState([]);
  const [lastOwnMessage, setLastOwnMessage] = useState(null);

  const arbitraryTolerance = 150;

  useEffect(() => {
    if (!chatEl.current) return;
    const maxScrollTop = chatEl.current.scrollHeight - chatEl.current.offsetHeight;
    if (chatEl.current.scrollTop >= maxScrollTop - arbitraryTolerance
      || (props.initMessages && !initMessages)) {
      chatEl.current.scrollTo(0, maxScrollTop);
      setInitMessages(true);
    }
  }, [props.initMessages, initMessages, props.messages, otherUser]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onNotificationClickListener = e => {
      if (!('newMessage' in e.data)) return;
      setOtherUser(e.data.newMessage);
    };

    navigator.serviceWorker.addEventListener('message', onNotificationClickListener);

    return () => {
      navigator.serviceWorker.removeEventListener('message', onNotificationClickListener)
    }
  }, []);

  useEffect(() =>
    props.currentUser && messaging(api => {
      api.getToken(DataStore.saveToken);
      api.onTokenRefresh(DataStore.saveToken);
      api.onMessage(({data}) =>
        (!document.hasFocus() || data.fromUid !== otherUser) && webNotifications.notify(
           data.fromName, data.body, {fromUserUid: data.fromUid}));
    }), [otherUser, props.currentUser]);

  useEffect(() => {
    const documentKeydownHandler = e => {
      if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
      return inputField.current.focus();
    };
    document.addEventListener('keydown', documentKeydownHandler);
    return () => document.removeEventListener('keydown', documentKeydownHandler);
  });

  useEffect(() => {
    window.history.pushState({}, "", '/' + otherUser);
  }, [otherUser]);

  const onSubmit = async e => {
    e.preventDefault();
    const payload = {
      from: props.currentUser.uid,
      to: otherUser,
      body: field
    };
    setField('');
    try {
      await DataStore.sendMessage(payload);
    } catch (e) {
      alert(`Sending message “${payload.message}” to ${toName(otherUser, props.names)} failed.\n\n${e}`);
    }
  };

  const rename = async newName =>
    await DataStore.putNames({...props.names, [otherUser]: newName});

  const deleteChat = async () =>
    await DataStore.deleteChatWithUser(otherUser);

  const onSelect = otherUser =>
    setOtherUser(otherUser);

  useEffect(() => {
    const otherUsers = props.messages
      .reduce((acc, m) => {
        const otherUser1 = MessageUtils.extractOtherUser(props.currentUser.uid, [m]);
        if (otherUser1 === otherUser) return acc;
        if (acc.indexOf(otherUser1) === -1) acc.push(otherUser1);
        return acc;
      }, []);
    setOtherUsers(otherUsers);
  }, [otherUser, props.messages, props.currentUser]);

  useEffect(() => {
    const ownMessages = props.messages
      .filter(m => m.from === props.currentUser.uid && m.to === otherUser);

    setLastOwnMessage(
      ownMessages.length === 0
        ? setLastOwnMessage(null)
        : ownMessages[ownMessages.length - 1]);
  }, [props.messages, otherUser, lastOwnMessage, props.currentUser]);

  const isOnlyEmoji = message =>
    !!message && !message
      .replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, '')
      .replace(/[^\x00-\x7F]/g, "")
      .length;

  return (
    <div className="chat" ref={chatEl}>
      <div className="head">
        <ChatMenu goToShareYourCode={props.goToShareYourCode}
                  goToEnterAnotherCode={props.goToEnterAnotherCode}
                  rename={rename} deleteChat={deleteChat} signOut={props.signOut}/>
        <div className="changeChat">
          <ChatSelect otherUsers={otherUsers}
                      otherUser={otherUser}
                      names={props.names}
                      onSelect={onSelect}/>
        </div>
      </div>
      <div className="body">
        {props.messages
          .filter(m =>
            MessageUtils.extractOtherUser(props.currentUser.uid, [m]) === otherUser)
          .sort((c1, c2) => c1.when - c2.when)
          .map(message => (
            <Fragment key={message.id}>
              <div className="message-wrapper">
                <div className={"message " + (otherUser === message.from ? "from" : "to")}>
                  <div className="overlay"/>
                  <p className={isOnlyEmoji(message.body.trim()) ? 'onlyEmoji' : ''}>
                    <Linkify>{message.body}</Linkify>
                  </p>
                </div>
              </div>
              {(lastOwnMessage != null && lastOwnMessage.id === message.id) && (
                <div className="status">
                  {message.when == null
                    ? 'Sending'
                    : (message.delivered ? 'Delivered' : 'Sent')}
                </div>
              )}
            </Fragment>)
          )}
      </div>
      <div className="foot">
        <form onSubmit={onSubmit}>
          <input onChange={e => setField(e.target.value)}
                 placeholder="Type here"
                 value={field}
                 required
                 ref={inputField}/>
        </form>
      </div>
    </div>
  );
};
