import Outbox from "./outbox";
import { Collection } from "./Collection";

interface Message {
  to: string;
  from: string;
  receivedAt: string;
  body: any;
}

export default class Messages {
  private outbox: Outbox;
  private collection: Collection;
  constructor(outbox: Outbox, collection: Collection) {
    this.outbox = outbox;
    this.collection = collection;
  }

  subscribe(
    callback: (newDoc: PouchDB.Core.ChangesResponseChange<Message>) => void,
  ) {
    return this.collection.subscribe(callback);
  }

  send({ to, body }: { to: string; body: any }) {
    this.outbox.post({ to, body });
  }

  getExchange(contact: string) {
    return this.collection.query("messages/byContact", {
      key: [contact],
      include_docs: true,
    });
  }
}
