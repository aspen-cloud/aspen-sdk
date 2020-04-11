import { nanoid } from "nanoid";
const docuri = require("docuri");

export class Collection {
  private db: PouchDB.Database;
  private collectionName: string;
  constructor(db: PouchDB.Database, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }
  update(
    id: string,
    updateFunc: (
      prevDoc: Partial<PouchDB.Core.IdMeta>,
    ) => Partial<PouchDB.Core.IdMeta> | false,
  ): void {
    this.db.upsert(createFullId(this.collectionName, id), (prevDoc) => {
      const updateResult = updateFunc(prevDoc);
      return updateResult;
    });
  }
  private addFullId(doc: { _id: string }) {
    const fullID = createFullId(this.collectionName, doc._id);
    return { ...doc, _id: fullID };
  }
  async put(doc: object, id: string) {
    if (id === "") throw new Error("Doc ID cannot be an empty string.");
    // const _id = id && { _id: id }; // Simple trick that prevents overwriting _id when id is undefined
    return this.db.put(this.addFullId({ ...doc, _id: id }));
  }
  async putIfNotExists(doc: { _id: string }) {
    return this.db.putIfNotExists(this.addFullId({ ...doc }));
  }
  async add(doc: object) {
    const _id = nanoid();
    this.db.post(this.addFullId({ ...doc, _id }));
  }
  async get(id: string) {
    return this.db.get(createFullId(this.collectionName, id));
  }
  async getAll(full: boolean = true) {
    return this.db.allDocs({ key: this.collectionName, include_docs: full });
  }
  subscribe(
    callback: (newDoc: PouchDB.Core.ChangesResponseChange<{}>) => void,
  ) {
    this.db
      .changes({
        since: "now",
        live: true,
        include_docs: true,
        filter: "aspen/collection",
        query_params: { collection: this.collectionName },
      })
      .on("change", function (change) {
        callback(change);
      });
  }
}

const idMaker = docuri.route("/:collection/:id");
function createFullId(collection: string, id: string): string {
  return idMaker({ collection, id });
}
