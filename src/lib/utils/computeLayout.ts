/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
import { ITopologyData, ITopologyNode } from '../declare';
import { DagreDirection, getNodeSize } from '.';
import config from '../config';
import Graph from './Graph';
import { ISelectionState } from '../components/selection';

type SortChilren = (parent: ITopologyNode, childrenList: ITopologyNode[]) => ITopologyNode[];

interface LayoutOptions {
    sortChildren?: SortChilren;
    boxSelectionBoundary?: ISelectionState;
    rankDir?: DagreDirection;
}

function computeLayout(data: ITopologyData, options: LayoutOptions) {
    console.log(options);
    const layoutGraph = new Graph({
        rankDir: options?.rankDir
    });
    layoutGraph.setNodeList(data.nodes.map((node) => {
        const nodeSize = getNodeSize(node.id);
        return [node.id, {
            label: node.id,
            width: nodeSize.width,
            height: nodeSize.height,
        }];
    }));
    layoutGraph.setEdgeList(data.lines.map(line => [line.start.split('-')?.[0], line.end]));
    layoutGraph.layout();
    const boundary = layoutGraph.getBoundary();
    const nodeMap = new Map();
    layoutGraph.getNodes().forEach((node) => {
        nodeMap.set(node.label, node);
    });
    const containerSize = {
        width: boundary.width,
        height: boundary.height
    };
    const leftOffset = containerSize.width / 2;
    const topOffset = containerSize.height / 2;

    let offsetX = 0;
    let offsetY = 0;
    if (options?.boxSelectionBoundary) {
        const {
            minX, minY, width: boxWidth, height: boxHeight
        } = options?.boxSelectionBoundary || {};
        offsetX = config.canvas.width / 2 - minX - boxWidth / 2;
        offsetY = config.canvas.height / 2 - minY - boxHeight / 2;
    }

    return data.nodes.map((node) => {
        const infoPos = nodeMap.get(node.id);
        const newPosition = {
            x: config.canvas.width / 2 + infoPos.x - leftOffset - offsetX,
            y: config.canvas.height / 2 + infoPos.y - topOffset - offsetY,
        };
        return {
            ...node,
            position: newPosition
        };
    });
}

export default computeLayout;
