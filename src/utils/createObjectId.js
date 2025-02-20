import mongoose from "mongoose";
// Update the ObjectId creation syntax
export const createObjectId = (id) => new mongoose.Types.ObjectId(id.toString());