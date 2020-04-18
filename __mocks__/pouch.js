const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-adapter-memory"));

class MockPouch {
  constructor() {
    this = new PouchDB("db", { adapter: "memory" });
  }

  static plugin() {}
}

export default jest.mock("pouchdb", () => new MockPouch());
