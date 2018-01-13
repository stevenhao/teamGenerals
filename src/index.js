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

// interfacing with firebase firestore
class Client {
  constructor(user) {
    this.user = user;
  }
  message(msg) {
    console.log('message', msg);
    db.collection("messages").add({
      user: this.user,
      message: msg,
      timestamp: Date.now()
    })
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }
}

// interfacing with the generals html page
class Bridge {
  getName() {
    return localStorage.getItem('GIO_CACHED_USERNAME');
  }
}

// interfacing with the user

class TeamGenerals extends React.Component {
  constructor() {
    super();
    this.state = {
      value: ''
    };
  }

  componentDidMount() {
    this.bridge = new Bridge();
    const user = this.bridge.getName()
    this.client = new Client(user);
    this.client.message('/joined the room');
  }

  render() {
    return <div className="root">
      Hello World
      <form onSubmit={() => {
        const msg = this.state.value;
        this.client.message(msg);
      }}>
      <label>
        Chat:
        <input type="text" value={this.state.value} onChange={event => {
          this.setState({value: event.target.value});
        }} />
    </label>
    <input type="submit" value="Submit" />
  </form>
</div>;
  }
}

const node = document.createElement('div');
node.setAttribute("style", "position:absolute;left:20px;top:20px");
document.body.appendChild(node);
ReactDOM.render(<TeamGenerals />, node);
