import { getCollection } from "./vectorStore";

export type Resume = {
    id: string;
    text: string | null;
    category?: string;
};

export async function retrieve(
    query: string,
    k = 3,
    categories?: string[]
): Promise<Resume[]> {
    const collection = await getCollection();
    const normalizedCategories = categories?.filter(Boolean) ?? [];

    const result = await collection.query({
        queryTexts: [query],
        nResults: k,
        where:
            normalizedCategories.length > 0
                ? {
                    category: { $in: normalizedCategories },
                }
                : undefined,
    });

    const ids = result.ids?.[0] ?? [];
    const docs = result.documents?.[0] ?? [];
    const metas = result.metadatas?.[0] ?? [];

    return docs.map((doc, i) => ({
        id: ids[i] ?? "",
        text: doc,
        category: metas[i]?.category as string | undefined,
    }));
}
