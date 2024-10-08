import { NodePulse } from "../lib/index.js";

const nodePulse = new NodePulse({
    useQryHub: true,
    chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
    nodeType: 'hyperion',
    nodeCount: 3,
    updateInterval: 30000, // 30 seconds
    historyfull: true,
    streamingEnabled: true,
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

        const response = await fetch(`${node}/v1/chain/get_info`);
        const chainInfo = await response.json();
        console.log('Chain info:', chainInfo);
    } catch (error) {
        console.error('Failed to get chain info:', error.message);
    }
}

example();

// Then call example() every 10 seconds
setInterval(example, 10000);