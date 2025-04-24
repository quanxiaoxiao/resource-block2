import {
  createEntry,
  fetchEntry,
} from './apis.mjs';

const name = 'avatar';

let entryItem = await fetchEntry(name);

if (!entryItem) {
  entryItem = await createEntry({
    name,
    alias: name,
  });
  console.log(`createEntry \`${entryItem.alias}\``);
} else {
  console.log(`entry \`${entryItem.alias}\` alreay exist`);
}
