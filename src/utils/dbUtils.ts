import mongoose, { ClientSession } from "mongoose";
// import mongoose from "mongoose";
// import ClientSession from "mongoose-trx";

type TransactionCallback = (session: ClientSession) => Promise<void>;

export const runInTransaction = async (callback: TransactionCallback) => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    await callback(session);
    await session.commitTransaction();
  } catch (error) {
    // Rollback any changes made in the database
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};