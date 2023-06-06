export declare const Utils: {
    convertToTree: ({ nodes, lines }: import("./declare").ITopologyData, process?: (data: import("./declare").ITopologyNode) => import("./declare").ITopologyNode) => import("./declare").ITopologyNode;
    onlyOneParent: (data: import("./declare").ITopologyData) => boolean;
    onlyOneRoot: (data: import("./declare").ITopologyData) => boolean;
    computeContentCenter: (nodes: import("./declare").ITopologyNode[]) => {
        x: number;
        y: number;
    };
};
export declare const topologyWrapper: any;
export { default as Topology } from './components/topology';
export { default as TemplateWrapper } from './components/template-wrapper';
