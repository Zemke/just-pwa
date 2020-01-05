import React, {useState} from 'react';
import './ChatMenu.css';
import DataStore from './dataStore.js';
import Auth from "./auth";
import Dropdown from "./Dropdown";

export default function ChatMenu(props) {

  const [dropdownTrigger, setDropdownTrigger] = useState(null);

  const rename = async () => {
    const newName = window.prompt("Name of chat:");
    await DataStore.saveChatName(newName);
  };

  const signOut = () =>
    Auth
      .signOut()
      .then(props.signOut);

  const deleteChat = async () => {
    if (!window.confirm("The chat will be irreversibly deleted. Are you sure?")) {
      return;
    }
    await DataStore.deleteChatWithUser(this.state.otherUser);
  };

  return (<>
    <div className="hamburger" role="button" ref={ref => setDropdownTrigger(ref)}>
      <div className="dot1"/>
      <div className="dot2"/>
      <div className="dot3"/>
    </div>

    <Dropdown dropdownTrigger={dropdownTrigger} className="chatHeadMenu attachTopRight">
      <ul>
        <li onClick={signOut}>
          Sign out
        </li>
        <li onClick={rename}>
          Rename chat
        </li>
        <li onClick={deleteChat}>
          Delete chat
        </li>
        <li onClick={props.goToShareYourCode}>
          Share code
        </li>
        <li onClick={props.goToEnterAnotherCode}>
          Enter code
        </li>
      </ul>
    </Dropdown>
  </>);
};