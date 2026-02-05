import { createEmbeddings, createChatCompletion } from "./openaiClient.js";
import { getPineconeIndex } from "./pineconeClient.js";

const buildEmailContext = (metadata, index) => {
    const subject = metadata?.subject || "Unknown subject";
    const from = metadata?.from || "Unknown sender";
    const date = metadata?.date || "Unknown date";
    const snippet = metadata?.snippet || "";

    return [
        `Email ${index + 1}:`,
        `Subject: ${subject}`,
        `From: ${from}`,
        `Date: ${date}`,
        snippet ? `Snippet: ${snippet}` : "Snippet: (no snippet available)",
    ].join("\n");
};

const buildAttachmentContext = (metadata, index) => {
    const filename = metadata?.filename || "Unknown file";
    const subject = metadata?.subject || "";
    const from = metadata?.from || "";
    const snippet = metadata?.snippet || "";

    return [
        `Document ${index + 1} (attachment: ${filename}):`,
        subject ? `From email subject: ${subject}` : "",
        from ? `From: ${from}` : "",
        snippet ? `Content excerpt: ${snippet}` : "Content: (no excerpt)",
    ]
        .filter(Boolean)
        .join("\n");
};

export const retrieveRelevantEmails = async (
    question,
    { topK = 6, namespace, filter } = {}
) => {
    const cleanQuestion = question?.trim();
    if (!cleanQuestion) {
        return [];
    }

    const [embedding] = await createEmbeddings([cleanQuestion]);
    if (!embedding) {
        return [];
    }

    const resolvedTopK = Math.min(Math.max(parseInt(topK, 10) || 6, 1), 20);
    const resolvedNamespace = namespace || process.env.PINECONE_NAMESPACE || "emails";
    const resolvedFilter = filter ?? { docType: { $in: ["email", "attachment"] } };

    const index = getPineconeIndex();
    const target = index.namespace(resolvedNamespace);
    const result = await target.query({
        vector: embedding,
        topK: resolvedTopK,
        includeMetadata: true,
        filter: resolvedFilter,
    });

    return result.matches || [];
};

export const buildContextFromMatches = (matches = []) => {
    if (!matches.length) {
        return "";
    }

    return matches
        .map((match, index) => {
            const meta = match.metadata || {};
            return meta.docType === "attachment"
                ? buildAttachmentContext(meta, index)
                : buildEmailContext(meta, index);
        })
        .join("\n\n");
};

export const buildCitationsFromMatches = (matches = []) =>
    matches.map((match) => {
        const metadata = match.metadata || {};
        const docType = metadata.docType || "email";
        return {
            id: match.id,
            score: match.score,
            docType,
            subject: metadata.subject || "",
            from: metadata.from || "",
            date: metadata.date || "",
            threadId: metadata.threadId || "",
            snippet: metadata.snippet || "",
            filename: metadata.filename || "",
        };
    });

const CHAT_MAX_TOKENS =
    parseInt(process.env.OPENAI_CHAT_MAX_TOKENS, 10) || 500;

const getBaseSystemPrompt = () =>
    "You are a helpful assistant that answers questions using the provided context, which may include emails and documents (attachments such as PDFs, Word files, or text files). " +
    "Use both email content and document excerpts to answer. If the context does not contain the answer, say you do not have enough information.";

export async function* generateRagAnswer(question, matches = []) {
    const context = buildContextFromMatches(matches);
    const systemPrompt = getBaseSystemPrompt();
    const userPrompt = [
        `Question: ${question}`,
        "",
        "Context:",
        context || "No relevant email or document context found.",
    ].join("\n");

    const stream = createChatCompletion({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        maxTokens: CHAT_MAX_TOKENS,
    });

    for await (const chunk of stream) {
        yield chunk;
    }
}

function buildMessagesWithHistory(question, matches, { priorMessages = [], memory = {} } = {}) {
    const context = buildContextFromMatches(matches);
    let systemContent = getBaseSystemPrompt();
    const memorySummary =
        memory && typeof memory.summary === "string" && memory.summary.trim()
            ? `\n\nConversation memory (use for context only): ${memory.summary.trim()}`
            : "";
    if (memorySummary) {
        systemContent += memorySummary;
    }

    const messages = [{ role: "system", content: systemContent }];

    for (const m of priorMessages) {
        const role = m.role === "system" ? "assistant" : "user";
        messages.push({ role, content: m.message || "" });
    }

    const userContent = [
        `Question: ${question}`,
        "",
        "Context:",
        context || "No relevant email or document context found.",
    ].join("\n");
    messages.push({ role: "user", content: userContent });

    return messages;
}

export async function* generateRagAnswerWithHistory(
    question,
    matches = [],
    { priorMessages = [], memory = {} } = {}
) {
    const messages = buildMessagesWithHistory(question, matches, {
        priorMessages,
        memory,
    });
    const stream = createChatCompletion({
        messages,
        temperature: 0.2,
        maxTokens: CHAT_MAX_TOKENS,
    });
    for await (const chunk of stream) {
        yield chunk;
    }
}
