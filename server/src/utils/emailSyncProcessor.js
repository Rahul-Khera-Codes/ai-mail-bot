/**
 * Shared email processing function used by both manual sync (Gmail API) and auto sync (IMAP)
 * Processes emails: extract → clean → embed → Pinecone upsert
 */

import {
    buildEmbeddingText,
    cleanBody,
    detectIntentFlags,
    extractEmailFields,
} from "./emailProcessing.js";
import { createEmbeddings } from "./openaiClient.js";
import { getPineconeIndex } from "./pineconeClient.js";

/**
 * Process emails and sync to Pinecone
 * @param {Array} emailData - Array of email objects in extractEmailFields format
 * @param {string} mailboxEmail - Email address of the mailbox (for direction detection)
 * @param {string} namespace - Pinecone namespace (default: "emails")
 * @returns {Promise<{syncedCount: number, attachmentChunksSynced: number, namespace: string}>}
 */
export const processEmailsToPinecone = async (
    emailData,
    mailboxEmail = "",
    namespace = null
) => {
    // Process emails: extract → clean → build embedding text
    const emails = emailData.map((fields) => {
        const cleanedBody = cleanBody(fields.body);
        const threadId = fields.inReplyTo || fields.messageId;
        const flags = detectIntentFlags(cleanedBody);
        const snippet = cleanedBody.slice(0, 1000);
        const embeddingText = buildEmbeddingText({
            subject: fields.subject,
            from: fields.from,
            body: cleanedBody,
        });

        return {
            ...fields,
            body: cleanedBody,
            threadId,
            embeddingText,
            flags,
            snippet,
        };
    });

    // Generate embeddings
    const embeddings = await createEmbeddings(
        emails.map((email) => email.embeddingText)
    );

    // Get Pinecone index
    const targetNamespace = namespace || process.env.PINECONE_NAMESPACE || "emails";
    const index = getPineconeIndex();
    const target = index.namespace(targetNamespace);

    // Build vectors
    const mailboxEmailLower = mailboxEmail.toLowerCase();
    const vectors = emails.map((email, idx) => ({
        id: email.messageId,
        values: embeddings[idx],
        metadata: {
            docType: "email",
            threadId: email.threadId,
            source: "gmail",
            date: email.date,
            subject: email.subject,
            from: email.from,
            snippet: email.snippet,
            direction:
                mailboxEmailLower &&
                (email.from || "").toLowerCase().includes(mailboxEmailLower)
                    ? "outbound"
                    : "inbound",
            hasAction: email.flags.hasAction,
            hasDecision: email.flags.hasDecision,
            hasConfirmation: email.flags.hasConfirmation,
        },
    }));

    // Upsert to Pinecone in batches
    const upsertBatchSize = 100;
    for (let i = 0; i < vectors.length; i += upsertBatchSize) {
        const batch = vectors.slice(i, i + upsertBatchSize);
        await target.upsert(batch);
    }

    return {
        syncedCount: vectors.length,
        attachmentChunksSynced: 0, // Attachments handled separately if needed
        namespace: targetNamespace,
    };
};
