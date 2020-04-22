# Aspen SDK

**Aspen is currently in private beta** to get a client id please request one [here](https://form.jotform.com/201044739342046)

## Installing

```bash
$ yarn add @aspen.cloud/aspen-sdk
or
$ npm i @aspen.cloud/aspen-sdk
```

## Getting started

1. Request a client ID [here](https://form.jotform.com/201044739342046)
2. Initiate the client

```javascript
import { createClient } from "@aspen.cloud/aspen-sdk";

const aspen = createClient({
  clientId: "your-client-id",
});
```

2. Start login for user

```javascript
aspen.login(); // Redirects user to authentication page and returns with token
```

2. Save data to the user's database

```javascript
const notes = aspen.currentUser().collection("notes");

await notes.add({
  text: "I should buy a giftcards to my favorite restaurants",
  type: "TODO",
  isDone: false,
});
```

For all methods you can use on collections [check here](https://github.com/aspen-cloud/aspen-sdk/blob/master/src/Collection.ts)

3. Send a document from the current user to another

```javascript
const docForJane = {
  title: 'Vacation ideas'
  text: 'How about a stay-cation?'
  type: 'normal'
}
await aspen.currentUser().sendDocTo(docFormJane, 'jane.doe');
```

4. Listen to new changes or received docs for user

```javascript
/**
 * Here we take a message from another user and add it to a comment our note list.
 */
aspen.currentUser().onNewMessage(async (receivedDoc) => {
  if (receivedDoc.type === "comment") {
    await aspen.collection("notes").upsert(receivedDoc.noteId, (note) => {
      return {
        ...note,
        comments: note.comments ? note.comments.append(comment) : [comment],
      };
    });
  }
});
```
