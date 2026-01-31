import {
    buildEmbeddingText,
    cleanBody,
    detectIntentFlags,
    extractEmailFields,
} from "../utils/emailProcessing.js";
import { createEmbeddings } from "../utils/openaiClient.js";
import { getPineconeIndex } from "../utils/pineconeClient.js";
import { getGmailClientForUser, listGmailMessages } from "../utils/gmailService.js";

const buildListOptions = (query, defaults) => {
    const maxResults = Math.min(
        Math.max(parseInt(query.maxResults, 10) || defaults.maxResults, 1),
        100
    );
    const fetchAll = query.all === "true";
    const maxTotal = Math.max(
        parseInt(query.maxTotal, 10) || defaults.maxTotal,
        1
    );
    const labelIds = query.labelIds
        ? query.labelIds.split(",").filter(Boolean)
        : undefined;
    const q = query.q || undefined;

    return { maxResults, fetchAll, maxTotal, labelIds, q, pageToken: query.pageToken };
};

export const handleGmailCallback = (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/gmail-sync`);
};

export const getMessages = async (req, res) => {
    try {
        const gmail = await getGmailClientForUser(req.user?.id);
        const { maxResults, fetchAll, maxTotal, labelIds, q, pageToken } =
            buildListOptions(req.query, { maxResults: 20, maxTotal: 200 });

        const { messages, nextPageToken, resultSizeEstimate } =
            await listGmailMessages(gmail, {
                maxResults,
                fetchAll,
                maxTotal,
                q,
                labelIds,
                pageToken,
            });

        const messageDetails = await Promise.all(
            messages.map(async (msg) => {
                const detail = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                });

                const headers = detail.data.payload?.headers || [];
                const headerMap = headers.reduce((acc, header) => {
                    acc[header.name] = header.value;
                    return acc;
                }, {});

                return {
                    id: detail.data.id,
                    threadId: detail.data.threadId,
                    snippet: detail.data.snippet,
                    subject: headerMap.Subject || "",
                    from: headerMap.From || "",
                    date: headerMap.Date || "",
                };
            })
        );

        return res.json({
            messages: messageDetails,
            nextPageToken,
            resultSizeEstimate,
            fetchedCount: messageDetails.length,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: "Failed to fetch Gmail messages",
            error: error.message,
        });
    }
};

export const syncMessages = async (req, res) => {
    try {
        const gmail = await getGmailClientForUser(req.user?.id);
        const { maxResults, fetchAll, maxTotal, labelIds, q, pageToken } =
            buildListOptions(req.query, { maxResults: 25, maxTotal: 200 });

        const { messages } = await listGmailMessages(gmail, {
            maxResults,
            fetchAll,
            maxTotal,
            q,
            labelIds,
            pageToken,
        });

        const details = [];
        const batchSize = 10;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchDetails = await Promise.all(
                batch.map((msg) =>
                    gmail.users.messages.get({
                        userId: "me",
                        id: msg.id,
                        format: "full",
                    })
                )
            );
            details.push(...batchDetails);
        }

        const emails = details.map((detail) => {
            const fields = extractEmailFields(detail.data);
            const cleanedBody = cleanBody(fields.body);
            const threadId = fields.inReplyTo || fields.messageId;
            const flags = detectIntentFlags(cleanedBody);
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
            };
        });

        const embeddings = await createEmbeddings(
            emails.map((email) => email.embeddingText)
        );

        const namespace = process.env.PINECONE_NAMESPACE || "emails";
        const index = getPineconeIndex();
        const target = index.namespace(namespace);

        const vectors = emails.map((email, index) => ({
            id: email.messageId,
            values: embeddings[index],
            metadata: {
                docType: "email",
                threadId: email.threadId,
                source: "gmail",
                date: email.date,
                direction: "inbound",
                hasAction: email.flags.hasAction,
                hasDecision: email.flags.hasDecision,
                hasConfirmation: email.flags.hasConfirmation,
            },
        }));

        const upsertBatchSize = 100;
        for (let i = 0; i < vectors.length; i += upsertBatchSize) {
            const batch = vectors.slice(i, i + upsertBatchSize);
            await target.upsert(batch);
        }

        return res.json({
            syncedCount: vectors.length,
            namespace,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: "Failed to sync Gmail messages to Pinecone",
            error: error.message,
        });
    }
};
