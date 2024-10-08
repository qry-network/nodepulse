import { NodePulse } from "../lib/index.js";

const nodePulse = new NodePulse({
    useQryHub: true,
    qryHubApiUrl: 'https://custom.qry.hub.api', // Optional: use a custom QRY Hub API URL
    chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
    nodeType: 'atomic',
    nodeCount: 3,
    updateInterval: 30000, // 30 seconds
    atomicassets: true,
    atomicmarket: true,
    onNodeUpdate: (nodes) => {
        console.log('Nodes updated:', nodes);
    },
    onError: (error) => {
        console.error('Error occurred:', error.message);
    },
    onFallback: (type, nodes) => {
        console.warn(`Fallback to ${type} nodes:`, nodes);
    }
});

async function example() {
    try {
        const node = await nodePulse.getNode();
        console.log('Using node:', node);

        const response = await fetch(`${node}/atomicassets/v1/assets?page=1&limit=10&order=desc&sort=asset_id`);
        const assets = await response.json();
        console.log('Assets:', assets);
    } catch (error) {
        console.error('Failed to get assets:', error.message);
    }
}

example();

// Then call example() every 10 seconds
setInterval(example, 10000);