const firebase = require('firebase');
const React = require('react');
const ReactDOM = require('react-dom');
require("firebase/firestore");
firebase.initializeApp({
  apiKey: 'AIzaSyBbbU_4HdVhOHLBUKg3gyRusSiGY8H9agA',
  authDomain: '*/generals.io/*',
  projectId: 'teamgenerals-c2fed'
});

const db = firebase.firestore();

// a simple wrapper around setInterval that loops immediately
const setIntervalNow = (cbk, delay) => {
  cbk();
  setInterval(cbk, delay);
};

// interfacing with firebase firestore
class Client {
  constructor(user) {
    this.user = user;
  }
  message(msg) {
    db.collection("messages").add({
      user: this.user,
      message: msg,
      timestamp: Date.now()
    })
  }

  shareView(view) {
    db.collection('views').doc(this.user).set({
      view: JSON.stringify(view),
    });
  }

  onViews(cbk) {
    db.collection('views').onSnapshot(_views => {
      if (_views && _views.docs) {
        const views = _views.docs
          .map(_doc => _doc.data())
        cbk(views.map(view => JSON.parse(view.view)));
      }
    });
  }

  beOnline() {
    setIntervalNow(
      () => {
        db.collection('users').doc(this.user).set({
          name: this.user,
          lastActive: Date.now()
        }, { merge: true });
      }, 5000);
  }
  onMessages(cbk) {
    db.collection('messages').orderBy('timestamp').onSnapshot(_messages => {
      if (_messages && _messages.docs) {
        const messages = _messages.docs.map(_doc => _doc.data())
        cbk(messages);
      }
    });
  }
  onFriends(cbk) {
    db.collection('users').orderBy('lastActive').onSnapshot(_users => {
      if (_users && _users.docs) {
        const users = _users.docs
          .map(_doc => _doc.data())
          .map(user => ({
            ...user,
            online: user.lastActive > Date.now() - 10000,
          })).sort((user1, user2) => {
            if (user1.online === user2.online) {
              return user1.name < user2.name ? -1 : 1;
            } else {
              return user1.online ? -1 : 1;
            }
          });
        cbk(users);
      }
    });
  }
}

// interfacing with the generals html page
class Bridge {
  getName() {
    return localStorage.getItem('GIO_CACHED_USERNAME');
  }

  getView() {
    const gridEl = document.querySelector('#map tbody');
    const grid = Array.from(gridEl.children)
      .map(tr =>
        Array.from(tr.children).map(td => {
          return {
            className: td.className,
            textContent: td.textContent,
          };
        })
      );
    return grid;
  }

  paintView(view) {
    const gridEl = document.querySelector('#map tbody');
    const grid = Array.from(gridEl.children)
      .forEach((tr, i) =>
        Array.from(tr.children).forEach((td, j) => {
          const data = view[i][j];
          if (data.className.indexOf('fog') === -1
            && td.className.indexOf('fog') !== -1
          ) {
            data.className.split(' ').forEach(cls => {
              if (cls !== '' && cls !== 'selected' && cls !== 'attackable') {
                td.classList.add(cls);
              }
            });
            td.innerHTML = data.textContent;
          }
        })
      );
  }

  inGame() {
    return document.querySelector('#map tbody') !== null;
  }
}
window.bridge = new Bridge();

// interfacing with the user

class TeamGenerals extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      friends: [],
      value: '',
      sharing: false,
    };
  }

  componentDidMount() {
    this.bridge = new Bridge();
    const user = this.bridge.getName()
    this.client = new Client(user);
    this.client.message('/joined the room');
    this.client.beOnline();
    this.client.onMessages(messages => {
      this.setState({messages});
    });
    this.client.onFriends(friends => {
      this.setState({friends});
    });
  }

  onShare() {
    if (!this.bridge.inGame()) return;
    setIntervalNow(() => {
      const view = this.bridge.getView();
      console.log('shareView', view);
      this.client.shareView(view);
    }, 1000);
    this.client.onViews(views => {
      console.log('onViews', views);
      views.forEach(view => {
        this.bridge.paintView(view);
      });
    });
    this.setState({
      sharing: true
    });
  }

  render() {
    const Message = ({user, message, timestamp}) => {
      const slashMessage = message.startsWith('/');

      return <div className={'message ' + (slashMessage ? 'slash' : '')}>
        <span className='message--timestamp'>{new Date(timestamp).toString()}</span>
        <span className='message--user'>{user}</span>
        { slashMessage ? ' ' : ': ' }
        <span className='message--message'>{ slashMessage ? message.substring(1) : message }</span>
      </div>
    };

    const Friend = ({name, online, sharing}) => {
      return <div className={'friend ' + (online ? 'online' : 'offline')}>
        {name}
        { sharing && <span className='friend sharing'/> }
      </div>
    }

    const Share = ({ sharing, onShare }) => {
      return <div
        className={'share ' + (sharing ? 'sharing' : '')}
        onClick={onShare}
      >
        { sharing ? 'Sharing' : 'Not Sharing' }
      </div>
    }


    return <div className="root">
      <div className='friends'>
        <h3>Your friends</h3>
        {this.state.friends.map((props, i) => (
          <Friend key={i} {...props} />
        ))}
      </div>
      <Share
        sharing={this.state.sharing}
        onShare={() => {this.onShare()}}
      />
      <div className='messages'>
        {this.state.messages.map((props, i) => (
          <Message key={i} {...props} />
        ))}
      </div>
      <form
        className='chatbar'
        onSubmit={(e) => {
          e.preventDefault();
          const msg = this.state.value;
          this.client.message(msg);
          this.setState({value: ''});
        }}>
        <input
          type="text" value={this.state.value} onChange={event => {
            this.setState({value: event.target.value});
          }}
        />
        <input
          type="submit" value="Chat"
        />
      </form>
    </div>;
  }
}

const node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(<TeamGenerals />, node);
