import {
  createEntry,
  fetchEntry,
} from './apis.mjs';

let entryItem = await fetchEntry('driver');

if (!entryItem) {
  entryItem = await createEntry({
    name: 'driver',
    alias: 'driver',
  });
  console.log(`createEntry \`${entryItem.alias}\``);
} else {
  console.log(`entry \`${entryItem.alias}\` alreay exist`);
}

