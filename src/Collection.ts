import { nanoid } from "nanoid";
import { createFullId, parseFullId, updateDocForClient } from "./utils";

/**
 * All data is stored in a named collection and collections are the context in which data can be created, fetched, and manipulated.
 */
export class Collection {
  private db: PouchDB.Database;
  private collectionName: string;
  constructor(db: PouchDB.Database, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  async update<Content>(
    id: string,
    updateFunc: PouchDB.UpsertDiffCallback<
      Partial<PouchDB.Core.Document<{} & Content>>
    >,
  ) {
    const resp = await this.db.upsert<
      Partial<PouchDB.Core.Document<{} & Content>>
    >(createFullId(this.collectionName, id), (prevDoc) => {
      const updateResult = updateFunc(prevDoc);
      return updateResult;
    });
    const { id: newId, collection } = parseFullId(resp.id);
    return { ...resp, id: newId, col: collection };
  }

  private addFullId(doc: { _id: string }) {
    const fullID = createFullId(this.collectionName, doc._id);
    return { ...doc, _id: fullID };
  }

  /**
   * Insert a doc into the collection with the specified ID.
   * If you want to update the doc, use `update` instead.
   * @param doc
   * @param id
   */
  async put(doc: object, id: string) {
    if (id === "") throw new Error("Doc ID cannot be an empty string.");
    // const _id = id && { _id: id }; // Simple trick that prevents overwriting _id when id is undefined
    const resp = await this.db.put(this.addFullId({ ...doc, _id: id }));
    const { id: newId, collection } = parseFullId(resp.id);
    return { ...resp, id: newId, collection };
  }

  /**
   * Insert a doc unless a doc with the same ID already exisits.
   * @param doc
   */
  async putIfNotExists(doc: { _id: string }) {
    const resp = await this.db.putIfNotExists(this.addFullId({ ...doc }));
    const { id, collection } = parseFullId(resp.id);
    return { ...resp, id, col: collection };
  }

  /**
   * Add a new document to the collection. The id will be automatically generated.
   * @param doc
   */
  async add(doc: object) {
    const _id = nanoid();
    const { ok, id, rev } = await this.db.post(this.addFullId({ _id, ...doc }));
    const parts = parseFullId(id);
    return { ok, id: parts.id, col: parts.collection, rev };
  }

  async addAll(docs: object[]) {
    const docsWithIds = docs.map((doc) => {
      const _id = nanoid();
      return this.addFullId({ _id, ...doc });
    });

    const bulkResp = await this.db.bulkDocs(docsWithIds);
    return bulkResp.map((resp) => {
      const { id, rev } = resp;
      const parts = parseFullId(id);
      return { id: parts.id, col: parts.collection, rev };
    });
  }

  /**
   * Get a document by a specific id in the collection
   * @param id
   */
  async get(id: string) {
    const doc = await this.db.get(createFullId(this.collectionName, id));
    return updateDocForClient(doc);
  }

  /**
   * Get all of the documents in the collection
   * @param full Whether or not to include the entire documents or just metadata like _id
   */
  async getAll(full: boolean = true) {
    const resp = await this.db.allDocs({
      key: this.collectionName,
      include_docs: full,
    });
    return {
      ...resp,
      rows: resp.rows.map((row) => {
        const doc = row.doc && updateDocForClient(row.doc);
        const { id } = parseFullId(row.id);
        return { ...row, doc, id };
      }),
    };
  }

  /**
   * Subscribe to all of the changes on a given collection
   * @param callback A function that gets called on new changes
   */
  subscribe(
    callback: (newDoc: PouchDB.Core.ChangesResponseChange<{}>) => void,
  ) {
    const changeListener = this.db
      .changes({
        since: "now",
        live: true,
        include_docs: true,
        filter: "aspen/collection",
        query_params: { collection: this.collectionName },
      })
      .on("change", function (change) {
        const { id, collection } = parseFullId(change.id);
        const changeForClient = {
          ...change,
          id,
          col: collection,
          doc: updateDocForClient(change.doc),
        };
        callback(changeForClient);
      });

    return () => {
      changeListener.cancel();
    };
  }

  share(docId: string, sharedTo: string[] | "public") {
    return this.update<{ shared?: string[] | "public" }>(docId, (doc) => {
      if (doc.shared && Array.isArray(doc.shared) && Array.isArray(sharedTo)) {
        return { ...doc, sharing: [...doc.shared, ...sharedTo] };
      }
      return { ...doc, sharing: sharedTo };
    });
  }

  //TODO potentially move out of collection

  query(
    index: string,
    options: {
      include_docs?: boolean;
      startkey?: any[];
      endkey?: any[];
      key: any[];
    },
  ) {
    return this.db.query(index, options);
  }
}

export class ExternalCollection {}
