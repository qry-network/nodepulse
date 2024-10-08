export interface NodePulseOptions {
    chainId?: string;
    nodeType?: 'hyperion' | 'atomic';
    network?: 'mainnet' | 'testnet';
    nodeCount?: number;
    updateInterval?: number;
    apiUrl?: string;
    useQryHub?: boolean;
    qryHubApiUrl?: string;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    historyfull?: boolean;
    streamingEnabled?: boolean;
    atomicassets?: boolean;
    atomicmarket?: boolean;
    defaultNodes?: Record<string, Record<string, string[]>>;
    logger?: Console;
    onNodeUpdate?: (nodes: string[]) => void;
    onError?: (error: Error) => void;
    onFallback?: (tag: string, nodes: string[]) => void;
}
export interface NodePulseHooks {
    onNodeUpdate: (nodes: string[]) => void;
    onError: (error: Error) => void;
    onFallback: (tag: string, nodes: string[]) => void;
}
export interface NodeData {
    url: string;
    region: string;
    country: string;
    timezone: string;
    historyfull: boolean;
    streaming: {
        enable: boolean;
        traces: boolean;
        deltas: boolean;
    };
    atomic: {
        atomicassets: boolean;
        atomicmarket: boolean;
    };
}
export declare class NodePulse {
    private readonly options;
    private readonly logger;
    private readonly defaultNodes;
    currentNodeIndex: number;
    nodes: string[];
    nodesReady: boolean;
    private hooks;
    nodesPromise: Promise<void>;
    useQryHub: boolean;
    qryHubApiUrl: string;
    chainId: string;
    constructor(options?: NodePulseOptions);
    updateNodes(): Promise<void>;
    getNode(): Promise<string>;
    waitForNodes(): Promise<void>;
    log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]): void;
    deepMerge(target: any, source: any): any;
    fetchQryHubNodes(): Promise<string[]>;
    fetchNodes(): Promise<string[]>;
    private applyFilterRules;
}
