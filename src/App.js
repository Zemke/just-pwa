import React from 'react';
import './App.css';
import Create from "./Create";
import Chat from "./Chat";
import DataStore from "./dataStore";
import SignIn from "./SignIn";
import Auth from "./auth";

export default class AppComponent extends React.Component {

  state = {chat: null};

  goToChat = chat => this.setState({chat});

  render() {
    if (this.state.signIn) {
      return <SignIn/>
    } else if (this.state.chat != null) {
      return <Chat chat={this.state.chat}
                   goToCreateChat={() => this.setState({chat: null})}
                   goToChat={chat => this.setState({chat})}/>;
    }

    return <Create goToChat={id => this.goToChat(id)}/>;
  }

  componentDidMount() {
    Auth.current()
      .then(() => {
        Notification.requestPermission();

        if (this.state.chat != null) return;
        const allChats = DataStore.getChats();
        if (allChats != null && allChats.length) {
          this.setState({chat: allChats[0]});
        }
      })
      .catch(() => this.setState({signIn: true}));
  }
}
