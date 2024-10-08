import { DEFAULT_NODES } from "./default.nodes.js";
import { chains } from "./chains.js";
const DEFAULT_API_URL = 'https://nodes.nodepulse.co/nodes';
const DEFAULT_QRY_HUB_API = 'https://api.hub.qry.network';
export class NodePulse {
    options;
    logger;
    defaultNodes;
    currentNodeIndex = 0;
    nodes = [];
    nodesReady = false;
    hooks;
    nodesPromise;
    useQryHub = false;
    qryHubApiUrl = DEFAULT_QRY_HUB_API;
    chainId = chains.byNetwork['mainnet'];
    constructor(options = {}) {
        if (options.useQryHub) {
            this.useQryHub = options.useQryHub || false;
            this.qryHubApiUrl = options.qryHubApiUrl || DEFAULT_QRY_HUB_API;
        }
        if (options.chainId) {
            this.chainId = options.chainId;
        }
        this.options = {
            nodeType: options.nodeType || 'hyperion',
            network: options.network || 'mainnet',
            nodeCount: options.nodeCount || 3,
            updateInterval: options.updateInterval || 30000,
            apiUrl: options.apiUrl || DEFAULT_API_URL,
            logLevel: options.logLevel || 'warn',
            historyfull: options.historyfull !== undefined ? options.historyfull : true,
            streamingEnabled: options.streamingEnabled !== undefined ? options.streamingEnabled : true,
            atomicassets: options.atomicassets !== undefined ? options.atomicassets : true,
            atomicmarket: options.atomicmarket !== undefined ? options.atomicmarket : true,
        };
        this.logger = options.logger || console;
        // Deep merge custom default nodes with original defaults
        this.defaultNodes = this.deepMerge(DEFAULT_NODES, options.defaultNodes || {});
        this.hooks = {
            onNodeUpdate: options.onNodeUpdate || (() => {
            }),
            onError: options.onError || (() => {
            }),
            onFallback: options.onFallback || (() => {
            }),
        };
        this.nodesPromise = this.updateNodes();
        setInterval(() => this.updateNodes(), this.options.updateInterval);
    }
    async updateNodes() {
        const maxRetries = 3;
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const nodeSet = new Set();
                // only fetch nodepulse nodes for WAX mainnet and testnet
                if (this.chainId === chains.byNetwork['mainnet'] || this.chainId === chains.byNetwork['testnet']) {
                    const nodePulseNodes = await this.fetchNodes();
                    nodePulseNodes.forEach(node => nodeSet.add(node));
                }
                if (this.useQryHub) {
                    const qryHubNodes = await this.fetchQryHubNodes();
                    qryHubNodes.forEach(node => nodeSet.add(node));
                }
                const nodes = [...nodeSet];
                if (nodes.length > 0) {
                    this.nodes = nodes;
                    this.log('info', 'Updated nodes:', this.nodes);
                    this.hooks.onNodeUpdate(this.nodes);
                    this.nodesReady = true;
                    return; // Success, exit the function
                }
                else {
                    this.log('warn', `Attempt ${retries + 1}: No nodes received or unexpected response.`);
                    this.hooks.onError(new Error('No nodes received or unexpected response'));
                }
            }
            catch (error) {
                this.log('error', `Attempt ${retries + 1}: Failed to fetch nodes:`, error.message);
                this.hooks.onError(new Error("No nodes received or unexpected response"));
            }
            retries++;
            if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        }
        // If all retries fail, keep existing nodes if available, otherwise use default nodes
        if (this.nodes.length > 0) {
            console.warn('All attempts to fetch nodes failed, keeping existing nodes.');
            this.hooks.onFallback("existing", this.nodes);
        }
        else {
            console.warn('All attempts to fetch nodes failed, using default nodes.');
            if (this.options.network && this.options.nodeType) {
                this.nodes = this.defaultNodes[this.options.nodeType][this.options.network];
            }
            this.hooks.onFallback("existing", this.nodes);
        }
    }
    async getNode() {
        if (!this.nodesReady) {
            await this.nodesPromise;
        }
        if (this.nodes.length === 0) {
            await this.updateNodes();
        }
        const node = this.nodes[this.currentNodeIndex];
        this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
        return node;
    }
    async waitForNodes() {
        if (!this.nodesReady) {
            await this.nodesPromise;
        }
    }
    log(level, ...args) {
        const levels = ['error', 'warn', 'info', 'debug'];
        if (levels.indexOf(level) <= levels.indexOf(this.options.logLevel)) {
            this.logger[level](...args);
        }
    }
    deepMerge(target, source) {
        if (typeof source !== 'object' || source === null) {
            return source;
        }
        const output = { ...target };
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Array) {
                output[key] = source[key];
            }
            else if (typeof source[key] === 'object') {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = this.deepMerge(target[key], source[key]);
            }
            else {
                Object.assign(output, { [key]: source[key] });
            }
        });
        return output;
    }
    async fetchQryHubNodes() {
        if (!this.options.network && !this.options.chainId) {
            return [];
        }
        const dataset = this.options.nodeType === 'hyperion' ? 'hyperion-v2' : 'atomic-assets-api';
        const reqUrl = `${this.qryHubApiUrl}/live_instances?chain=${this.chainId}&dataset=${dataset}`;
        try {
            const response = await fetch(reqUrl);
            console.log('response', response);
            if (response.status !== 200) {
                return [];
            }
            const nodes = await response.json();
            if (!nodes) {
                return [];
            }
            return nodes.map((node) => node.endpoint);
        }
        catch (error) {
            throw new Error(`Failed to fetch QRY Hub nodes: ${error.message}`);
        }
    }
    async fetchNodes() {
        if (!this.options.apiUrl) {
            throw new Error('API URL is required');
        }
        const url = new URL(this.options.apiUrl);
        if (this.options.nodeType) {
            url.searchParams.append('type', this.options.nodeType);
        }
        if (this.options.network) {
            url.searchParams.append('network', this.options.network);
        }
        if (this.options.nodeCount) {
            url.searchParams.append('count', this.options.nodeCount.toString());
        }
        switch (this.options.nodeType) {
            case 'hyperion': {
                if (this.options.historyfull !== undefined) {
                    url.searchParams.append('historyfull', this.options.historyfull.toString());
                }
                if (this.options.streamingEnabled !== undefined) {
                    url.searchParams.append('streaming', this.options.streamingEnabled.toString());
                }
                break;
            }
            case 'atomic': {
                if (this.options.atomicassets !== undefined) {
                    url.searchParams.append('atomicassets', this.options.atomicassets.toString());
                }
                if (this.options.atomicmarket !== undefined) {
                    url.searchParams.append('atomicmarket', this.options.atomicmarket.toString());
                }
                break;
            }
        }
        try {
            return (await (await fetch(url.toString())).json())
                .filter(node => this.applyFilterRules(node))
                .map(node => node.url);
        }
        catch (error) {
            throw new Error(`Failed to fetch nodes: ${error.message}`);
        }
    }
    applyFilterRules(node) {
        const opt = this.options;
        switch (opt.nodeType) {
            case 'hyperion': {
                return opt.historyfull === node.historyfull && opt.streamingEnabled === node.streaming.enable;
            }
            case 'atomic': {
                return opt.atomicassets === node.atomic.atomicassets && opt.atomicmarket === node.atomic.atomicmarket;
            }
            default: {
                return true;
            }
        }
    }
}
