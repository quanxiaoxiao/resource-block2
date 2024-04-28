import mongoose from 'mongoose';
import blockSchema from './block.mjs';
import resourceSchema from './resource.mjs';
import entrySchema from './entry.mjs';

export const Block = mongoose.model('Block', blockSchema);
export const Resource = mongoose.model('Resource', resourceSchema);
export const Entry = mongoose.model('Entry', entrySchema);
