const decodeBase64Url = (data) => {
    if (!data) return "";
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = normalized.length % 4;
    const padded =
        padLength === 0 ? normalized : normalized + "=".repeat(4 - padLength);
    return Buffer.from(padded, "base64").toString("utf8");
};

const getHeaderValue = (headers, name) => {
    const header = headers.find(
        (h) => h.name?.toLowerCase() === name.toLowerCase()
    );
    return header?.value || "";
};

const findPartByMime = (payload, mimeTypes) => {
    if (!payload) return null;
    if (mimeTypes.includes(payload.mimeType) && payload.body?.data) {
        return payload.body.data;
    }
    if (payload.parts?.length) {
        for (const part of payload.parts) {
            const found = findPartByMime(part, mimeTypes);
            if (found) return found;
        }
    }
    return null;
};

const extractBodyFromPayload = (payload) => {
    const plainData = findPartByMime(payload, ["text/plain"]);
    const htmlData = findPartByMime(payload, ["text/html"]);
    const data = plainData || htmlData || payload?.body?.data;
    return decodeBase64Url(data);
};

const decodeEntities = (text) => {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'");
};

const stripSignatures = (text) => {
    return text
        .replace(/(\n--\s*\n[\s\S]*$)/, "")
        .replace(/\nSent from my .*$/i, "");
};

export const cleanBody = (text) => {
    const noHtml = stripSignatures(text).replace(/<[^>]*>/g, " ");
    const decoded = decodeEntities(noHtml);
    return decoded.replace(/\s+/g, " ").trim();
};

export const extractEmailFields = (gmailMessage) => {
    const payload = gmailMessage.payload || {};
    const headers = payload.headers || [];

    const subject = getHeaderValue(headers, "Subject");
    const from = getHeaderValue(headers, "From");
    const date = getHeaderValue(headers, "Date");
    const messageIdHeader = getHeaderValue(headers, "Message-ID");
    const inReplyTo = getHeaderValue(headers, "In-Reply-To");

    const body = extractBodyFromPayload(payload);
    const messageId = messageIdHeader || gmailMessage.id;

    return {
        subject,
        from,
        date,
        body,
        messageId,
        inReplyTo,
    };
};

export const detectIntentFlags = (body) => {
    return {
        hasAction: /action required|please respond|waiting for your response/i.test(
            body
        ),
        hasDecision: /we decided|final decision|approved/i.test(body),
        hasConfirmation: /confirmed|successfully|completed/i.test(body),
    };
};

export const buildEmbeddingText = ({ subject, from, body }) => {
    return `
Subject: ${subject}

From: ${from}

Message:
${body}
    `.trim();
};

/** MIME types we parse for RAG (documents only; excludes images/binary) */
const RAG_ATTACHMENT_MIMES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "text/plain",
    "text/csv",
    "text/html",
]);

const collectAttachmentParts = (payload, acc = []) => {
    if (!payload) return acc;
    if (payload.filename && payload.body?.attachmentId) {
        const mime = (payload.mimeType || "").toLowerCase();
        if (RAG_ATTACHMENT_MIMES.has(mime)) {
            acc.push({
                filename: payload.filename,
                mimeType: payload.mimeType,
                attachmentId: payload.body.attachmentId,
            });
        }
    }
    if (payload.parts?.length) {
        for (const part of payload.parts) {
            collectAttachmentParts(part, acc);
        }
    }
    return acc;
};

export const getRagRelevantAttachments = (gmailMessage) => {
    const payload = gmailMessage?.payload;
    return collectAttachmentParts(payload || {});
};
