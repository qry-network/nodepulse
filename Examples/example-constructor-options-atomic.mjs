import NodePulse from '../NodePulse.js';

const nodePulse = new NodePulse({
  nodeType: 'atomic', 
  network: 'mainnet', 
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
    
    const response = await fetch(`${node}/atomicmarket/v1/assets?owner=sentnlagents&page=1&limit=100&order=desc&sort=asset_id`);
    const assets = await response.json();
    console.log('Assets:', assets);
  } catch (error) {
    console.error('Failed to get assets:', error.message);
  }
}

example();

// Then call example() every 10 seconds
setInterval(example, 10000);