// Import the Pinecone library
const { Pinecone } = require ('@pinecone-database/pinecone')
// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const ChatgptIndex = pc.Index('chat-gpt');


async function CreateMemory(vectors,metadata,messageId) {
    await ChatgptIndex.upsert([ {
        id: messageId,
        values: vectors,
        metadata
    } ])
}

async function queryMemory({queryVector, limit = 5, metadata}) {
    
    const data = await ChatgptIndex.query({
        vector: queryVector,
        topK: limit,
        filter:metadata ? metadata : undefined,
        includeMetadata: true
    })
    return data.matches
}

moducle.exports ={
    CreateMemory,
    queryMemory
}