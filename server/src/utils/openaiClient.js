import OpenAI from "openai";

let openaiClient;

const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY");
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return openaiClient;
};

export const createEmbeddings = async (inputs) => {
    if (!Array.isArray(inputs) || inputs.length === 0) {
        return [];
    }

    const client = getOpenAIClient();
    const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

    const response = await client.embeddings.create({
        model,
        input: inputs,
    });

    return response.data.map((item) => item.embedding);
};
