import mongoose from "mongoose";

const gmailConnectionSchema = new mongoose.Schema(
    {
        admin_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        google_account_email: {
            type: String,
            required: true,
        },

        refresh_token: {
            type: String,
            required: true, // encrypted
        },

        scope: {
            type: String,
            required: true,
        },

        sync_status: {
            type: String,
            enum: ["connected", "syncing", "error"],
            default: "connected",
        },

        last_synced_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("GmailConnection", gmailConnectionSchema);
