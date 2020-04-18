const docuri = require("docuri");
const idMaker = docuri.route("/:collection/:id");

export function createFullId(collection: string, id: string): string {
  return idMaker({ collection, id });
}
export function parseFullId(id: string) {
  return idMaker(id);
}
export function updateDocForClient(
  doc: PouchDB.Core.Document<any>,
): PouchDB.Core.Document<any> & {
  _col: string;
} {
  const { id, collection } = parseFullId(doc._id);
  return { ...doc, _id: id, _col: collection };
}
