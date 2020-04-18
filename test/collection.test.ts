import PouchDB from "pouchdb";
import { AuthUserContext } from "../src/AspenClient";
import Outbox from "../src/outbox";

PouchDB.plugin(require("pouchdb-adapter-memory"));
const pouchAllDocs = PouchDB.prototype.allDocs;
// @ts-ignore
PouchDB.plugin({
  allDocs: function ({ include_docs, key }) {
    const startkey = `/${key}/`;
    const endkey = startkey + "\ufff0";
    return pouchAllDocs.call(this, { include_docs, startkey, endkey });
  },
});

let db: PouchDB.Database;
let outDB: PouchDB.Database;
let outbox: Outbox;
let authUser: AuthUserContext;
const mockMessageSender = jest.fn().mockResolvedValue(null);

const collectionFilter = {
  _id: "_design/aspen",
  filters: {
    collection: function (doc, req) {
      const _doc$_id$split = doc._id.split("/");
      const collectionId = _doc$_id$split[1];
      return collectionId === req.query.collection;
    }.toString(),
  },
};

describe.only("Can manipulate collections for authenticated user", () => {
  const firstCollectionName = "test1";
  const secondCollectionName = "test2";
  const testId = "testId";

  beforeAll(async () => {
    db = new PouchDB("db", { adapter: "memory" });
    await db.put(collectionFilter);
    outDB = new PouchDB("outbox", { adapter: "memory" });
    outbox = new Outbox({
      db: outDB,
      messageSender: mockMessageSender,
    });
    authUser = new AuthUserContext({ db, outbox });
  });

  beforeEach(async () => {
    if (db) {
      await db.destroy();
      await outDB.destroy();
    }
    db = new PouchDB("db", { adapter: "memory" });
    await db.put(collectionFilter);
    outDB = new PouchDB("outbox", { adapter: "memory" });
    outbox = new Outbox({
      db: outDB,
      messageSender: mockMessageSender,
    });
    //await db.put(collectionIndex);
    authUser = new AuthUserContext({ db, outbox });
  });

  test("can define collections", () => {
    const collection = authUser.collection("test");
    expect(collection).toBeDefined();
  });

  test("can add data to a collection", async () => {
    const addResp = await authUser
      .collection(firstCollectionName)
      .add({ test: "data" });

    expect(addResp.id).toBeDefined();
    expect(addResp.rev).toBeDefined();
    expect(addResp.col).toBe(firstCollectionName);
  });

  test("can add a doc and use the provided id in a collection", async () => {
    const addResp = await authUser
      .collection(firstCollectionName)
      .add({ test: "data", _id: testId });
    expect(addResp.id).toBe(testId);
    expect(addResp.rev).toBeDefined();
    expect(addResp.col).toBe(firstCollectionName);
  });

  test("add will fail on conflicting ids", async () => {
    const docWithId = { test: "data", _id: testId };

    const { id } = await authUser
      .collection(firstCollectionName)
      .add(docWithId);

    expect.hasAssertions();

    try {
      await authUser.collection(firstCollectionName).add(docWithId);
    } catch (e) {
      expect(e.status).toBe(409);
      expect(e.name).toBe("conflict");
      expect(e.docId.includes(id)).toBeTruthy();
    }
  });

  test("can get all data in a collection", async () => {
    const docs = [{ a: "b" }, { c: "d" }];
    await authUser.collection(firstCollectionName).addAll(docs);

    const getAll = await authUser.collection(firstCollectionName).getAll();

    expect(getAll.rows.length).toBe(docs.length);
  });

  test("collections do not overlap", async () => {
    const firstDocs = [
      { a: "b", _id: "a" },
      { c: "d", _id: "b" },
    ];
    await authUser.collection(firstCollectionName).addAll(firstDocs);

    const secondDocs = [
      { a: "b", _id: "c" },
      { c: "d", _id: "d" },
    ];
    await authUser.collection(secondCollectionName).addAll(secondDocs);

    const firstGetAll = await authUser.collection(firstCollectionName).getAll();

    expect(firstGetAll.rows.length).toBe(firstDocs.length);
    expect(firstGetAll.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(firstDocs.map((doc) => doc._id)),
    );

    const secondGetAll = await authUser
      .collection(firstCollectionName)
      .getAll();

    expect(secondGetAll.rows.length).toBe(secondDocs.length);
    expect(secondGetAll.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(firstDocs.map((doc) => doc._id)),
    );
  });

  test("You can send a document to another user via outbox", async () => {
    const doc = { test: "data" };
    await authUser.sendDocTo(doc, "anotherUser");

    expect(mockMessageSender).toHaveBeenCalled();
  });

  test("Can subscribe to collections", async () => {
    const firstCollection = authUser.collection(firstCollectionName);
    const secondCollection = authUser.collection(secondCollectionName);
    const doc = { _id: "testInsert", value: 1234 };

    const subResp: PouchDB.Core.ChangesResponseChange<{
      _col: string;
      value: string;
    }> = await new Promise(async (resolve, reject) => {
      firstCollection.subscribe((newDoc) => {
        resolve(
          newDoc as PouchDB.Core.ChangesResponseChange<{
            _col: string;
            value: string;
          }>,
        );
      });
      firstCollection.add(doc);
      secondCollection.add(doc);
    });

    expect(subResp.id).toBe("testInsert");
    expect(subResp.doc._col).toBe(firstCollectionName);
  });
});
