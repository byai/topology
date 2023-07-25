/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
import dagre from 'dagre';
import { ITopologyData, ITopologyNode } from '../declare';
import { getNodeSize } from '.';
import config from '../config';
import { Graph } from './Graph';

type SortChilren = (parent: ITopologyNode, childrenList: ITopologyNode[]) => ITopologyNode[];

interface LayoutOptions {
    sortChildren?: SortChilren;
}

function computeLayout(data: ITopologyData, options: LayoutOptions) {
    console.log(options);
    const layoutGraph = new Graph();
    layoutGraph.setNodeList(data.nodes.map((node) => {
        const nodeSize = getNodeSize(node.id);
        return [node.id, {
            label: node.id,
            width: nodeSize.width,
            height: nodeSize.height,
        }];
    }));
    layoutGraph.setEdgeList(data.lines.map((line) => {
        return [line.start.split('-')?.[0], line.end];
    }));
    layoutGraph.layout();
    const boundary = layoutGraph.getBoundary();
    const nodeMap = new Map();
    layoutGraph.getNodes().map(node => {
        nodeMap.set(node.label, node);
    });
    const containerSize = {
        width: boundary.width,
        height: boundary.height
    };
    const leftOffset = containerSize.width / 2;
    const topOffset = containerSize.height / 2;
    return data.nodes.map((node) => {
        const infoPos = nodeMap.get(node.id);
        const newPosition = {
            x: config.canvas.width / 2 + infoPos.x - leftOffset,
            y: config.canvas.height / 2 + infoPos.y - topOffset,
        };
        return {
            ...node,
            position: newPosition
        };
    });
}

export default computeLayout;
