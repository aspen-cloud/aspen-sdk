enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  REJECTED = "REJECTED",
}

export interface OutBoundMessage {
  to: string; // username of recipient
  body: any;
  status: MessageStatus;
}
type MessageSender = ({ to, body }: { to: string; body: any }) => Promise<any>;

export default class Outbox {
  private db: PouchDB.Database<OutBoundMessage>;
  private handler: MessageSender;
  constructor({ db, messageSender }) {
    this.db = db;
    this.handler = messageSender;
    this.handleSentMessages();
  }
  post({ to, body }: { to: string; body: any }) {
    return this.db.post({
      to,
      body,
      status: MessageStatus.SENT,
    });
  }
  getAll(status?: MessageStatus) {
    // TODO add index on status
    return this.db.allDocs({
      include_docs: true,
    });
  }
  handleSentMessages() {
    const changes = this.db.changes({
      since: "now",
      live: true,
      include_docs: true,
    });
    changes.on("change", async (change) => {
      if (change.deleted) return;
      const { changes, doc } = change;

      if (doc.status !== MessageStatus.SENT) {
        return; //TODO add retry logic for rejected messages
      }
      const { to, body } = doc;
      try {
        await this.handler({ to, body });
        await this.db.put({ ...doc, status: MessageStatus.DELIVERED });
      } catch (e) {
        await this.db.put({ ...doc, status: MessageStatus.REJECTED });
      }
    });
  }
}
