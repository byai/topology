import dagre from 'dagre';
import { DagreDirection } from '.';
import config from '../config';

export default class Graph {
    private graphObj: dagre.graphlib.Graph;

    constructor(opt?: { rankSep?: number; nodeSep?: number; rankDir?: DagreDirection }) {
        const { rankSep = config.autoLayout.verticalSpacing, nodeSep = config.autoLayout.horizontalSpacing, rankDir = DagreDirection.TB } = opt ?? {};
        const g = new dagre.graphlib.Graph({});
        g.setGraph({ ranksep: rankSep, nodesep: nodeSep, rankdir: rankDir });
        g.setDefaultEdgeLabel(() => ({}));
        this.graphObj = g;
    }

    setNode = (...args: Parameters<typeof this.graphObj.setNode>) => {
        this.graphObj.setNode(...args);
    }

    setNodeList = (nodeInfoList: Parameters<typeof this.graphObj.setNode>[]) => {
        nodeInfoList.forEach(nodeArgs => {
            this.setNode(...nodeArgs);
        });
    }

    setEdge = (...args: Parameters<typeof this.graphObj.setEdge>) => {
        this.graphObj.setEdge(...args);
    }

    setEdgeList = (edgeInfoList: Parameters<typeof this.graphObj.setEdge>[]) => {
        edgeInfoList.forEach(edgeArgs => {
            this.setEdge(...edgeArgs);
        });
    }

    layout = () => {
        dagre.layout(this.graphObj);
    }

    getNodeLabelList = () => {
        return this.graphObj.nodes();
    }

    getNodes = () => {
        return this.graphObj.nodes().map(label => {
            // x, y 坐标是中心点坐标
            const {
                width, height, x, y, ...otherInfo
            } = this.graphObj.node(label);
            const halfWidth = width / 2;
            const halfHeight = height / 2;
            return {
                x: x - halfWidth,
                y: y - halfHeight,
                width,
                height,
                ...otherInfo,
            };
        });
    }

    getBoundary = () => {
        const bar = this.getNodes().reduce((prev, curr) => {
            const {
                width, height, x, y
            } = curr;
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
        return {
            width: bar.right - bar.left,
            height: bar.bottom - bar.top,
            ...bar,
        };
    }
}
