/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
import dagre from 'dagre';
import { ITopologyData, ITopologyNode } from '../declare';
import { getNodeSize } from '.';
import config from '../config';

type SortChilren = (parent: ITopologyNode, childrenList: ITopologyNode[]) => ITopologyNode[];

interface LayoutOptions {
    sortChildren?: SortChilren;
}

function computeLayout(data: ITopologyData, options: LayoutOptions) {
    console.log(options);
    const g = new dagre.graphlib.Graph({});
    g.setGraph({ ranksep: config.autoLayout.verticalSpacing, nodesep: config.autoLayout.horizontalSpacing });
    g.setDefaultEdgeLabel(() => ({}));
    data.nodes.forEach((node) => {
        const nodeSize = getNodeSize(node.id);
        g.setNode(node.id, {
            label: node.id,
            width: nodeSize.width,
            height: nodeSize.height,
        });
    });
    data.lines.forEach((line) => {
        g.setEdge(line.start.split('-')?.[0], line.end);
    });
    dagre.layout(g);
    const nodeMap = new Map();
    const bar = g.nodes().reduce((prev, curr) => {
        const {
            width, height, x, y
        } = g.node(curr);
        nodeMap.set(curr, { x, y });
        const top = Math.min(prev.top, y);
        const left = Math.min(prev.left, x);
        const bottom = Math.max(prev.bottom, y + height);
        const right = Math.max(prev.right, x + width);
        return {
            top,
            left,
            bottom,
            right,
        };
    }, {
        top: Infinity,
        left: Infinity,
        bottom: -Infinity,
        right: -Infinity
    });
    const containerSize = {
        width: bar.right - bar.left,
        height: bar.bottom - bar.top
    };
    const leftOffset = bar.left + containerSize.width / 2;
    const topOffset = bar.top + containerSize.height / 2;
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
