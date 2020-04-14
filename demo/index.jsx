import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import * as Aspen from "../lib/index.js"; //Prod build
//import Aspen from "../src/index";
import "./app.css";

const aspen = Aspen.createClient({
  clientId: "my-second-aspen-spa",
  callbackURL: window.location.origin + "/aspen-auth-callback",
});

function App() {
  const [todos, setTodos] = useState([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!aspen.isLoggedIn()) {
      return;
    }
    aspen
      .collection("todos")
      .getAll()
      .then((docs) => setTodos(docs.map((doc) => doc.doc)));

    aspen.collection("todos").subscribe((changes) => {
      const newDoc = changes.doc;
      //newDoc._id = "/" + newDoc._id.split("/").slice(2).join("/");
      setTodos((oldTodos) => {
        console.log(oldTodos, newDoc);
        const matchingIndex = oldTodos
          .map(({ _id }) => _id)
          .indexOf(newDoc._id);
        if (matchingIndex > -1) {
          const copy = [...oldTodos];
          copy[matchingIndex] = newDoc;
          return copy;
        } else {
          return [newDoc, ...oldTodos];
        }
      });
    });
  }, []);

  if (!aspen.isLoggedIn()) {
    return (
      <div className="App">
        <button onClick={() => aspen.login()}>Login</button>
      </div>
    );
  }
  return (
    <div className="App">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log(newNote);
          aspen.collection("todos").add({ note: newNote, isDone: false });
          setNewNote("");
        }}
      >
        <input
          type="text"
          value={newNote}
          onChange={(e) => {
            setNewNote(e.target.value);
          }}
        />
      </form>
      {todos
        .filter((todo) => !todo.isDone)
        .map((todo) => (
          <Todo
            key={todo._id}
            note={todo.note}
            isDone={todo.isDone}
            onToggle={() => {
              aspen
                .collection("todos")
                .update(todo._id.split("/")[2], (oldDoc) => {
                  return { ...oldDoc, isDone: !oldDoc.isDone };
                });
            }}
          />
        ))}
      <hr />
      <div className="finished">
        {todos
          .filter((todo) => todo.isDone)
          .map((todo) => (
            <Todo
              key={todo._id}
              note={todo.note}
              isDone={todo.isDone}
              onToggle={() => {
                aspen
                  .collection("todos")
                  .update(todo._id.split("/")[2], (oldDoc) => {
                    return { ...oldDoc, isDone: !oldDoc.isDone };
                  });
              }}
            />
          ))}
      </div>
    </div>
  );
}

function Todo({ note, isDone, onToggle }) {
  return (
    <div className="todo">
      <div>{note}</div>
      <input type="checkbox" checked={isDone} onChange={onToggle} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
