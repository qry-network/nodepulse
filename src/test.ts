import {NodePulse} from "./nodepulse.js";

const nodePulse = new NodePulse({
    historyfull: false,
    nodeType: "hyperion",
    useQryHub: true,
    // chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906"
});

async function example() {
    try {
        const node = await nodePulse.getNode();
        console.log('Using node:', node);
        const response = await fetch(`${node}/v1/chain/get_info`);
        const chainInfo = await response.json();
        console.log('Chain info:', chainInfo);
    } catch (error: any) {
        console.error('Failed to get chain info:', error.message);
    }
}

await example();

// Then call example() every 10 seconds
setInterval(example, 10000);
