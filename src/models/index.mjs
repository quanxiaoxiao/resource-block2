import mongoose from 'mongoose';

import blockSchema from './block.mjs';
import entrySchema from './entry.mjs';
import resourceSchema from './resource.mjs';
import resourceRecordSchema from './resourceRecord.mjs';

export const Block = mongoose.model('Block', blockSchema);
export const Resource = mongoose.model('Resource', resourceSchema);
export const Entry = mongoose.model('Entry', entrySchema);
export const ResourceRecord = mongoose.model('ResourceRecord', resourceRecordSchema);
