import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Aspen from "../src/index";
import { updateStatement } from "typescript";
import { ConnectionState } from "../src/types";

// const aspen = new Aspen({
//   clientId: "my-second-aspen-spa",
//   callbackURL: window.location.origin + "/aspen-auth-callback",
// });

const aspen = Aspen.createClient({
  clientId: "my-second-aspen-spa",
  callbackURL: window.location.origin + "/aspen-auth-callback",
});

console.log(aspen);

function App() {
  const [isLoggedIn, setLoggedIn] = useState(aspen.isLoggedIn);
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [isRecipientLocked, setRecipientLocked] = useState(false);
  const [messageText, setMessageText] = useState("");

  const addMessage = (msg) => {
    setMessages((oldMessages) => [...oldMessages, msg]);
  };

  useEffect(() => {
    // if (aspen.db) {
    //   const changes = aspen.db
    //     .changes({
    //       since: "now",
    //       live: true,
    //       include_docs: true,
    //     })
    //     .on("change", function(change) {
    //       console.log(change.doc);
    //       addMessage(change.doc);
    //     });
    //   return changes.cancel;
    // }
  }, [aspen.db]);

  useEffect(() => {
    // aspen.user.onAuthChange(state => {
    //   if (state !== ConnectionState.CONNECTED) {
    //     setLoggedIn(false);
    //   }
    // });
  }, []);

  function sendMessage() {
    aspen.sendDocTo(
      {
        text: messageText,
      },
      recipient,
    );
    addMessage({
      from: "You",
      data: {
        text: messageText,
      },
    });
    setMessageText("");
  }

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => {
          aspen.login();
        }}
      >
        Login
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          aspen.logout();
        }}
      >
        Logout
      </button>
      <div>
        <input
          placeholder="Username"
          disabled={isRecipientLocked}
          onChange={(e) => {
            setRecipient(e.target.value);
          }}
        />
        <button
          onClick={() => {
            setRecipientLocked(!isRecipientLocked);
          }}
        >
          {!isRecipientLocked ? "Connect" : "Disconnect"}
        </button>
        {isRecipientLocked ? (
          <div>
            <div>
              {messages.map((message) => (
                <div>{`${message.from} : ${message.data.text}`}</div>
              ))}
            </div>
            <hr />
            <div>
              <input
                onChange={(e) => {
                  setMessageText(e.target.value);
                }}
                value={messageText}
                placeholder="Write a message"
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
