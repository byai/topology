// import { path } from 'd3-path';
import {
    IPosition,
    ITopologyNode,
} from '../declare';

export enum DagreDirection {
    TB = 'TB',
    BT = 'BT',
    LR = 'LR',
    RL = 'RL',
}

export const shouldAutoLayout = (nodes: ITopologyNode[]) => {
    if (nodes.length === 0) {
        return false;
    }
    return !nodes.find(item => !!item.position);
};

const computeCanvasPoHelper = ($wrapper: HTMLDivElement) => {
    // 当窗口有滚动时，需加上窗口的滚动
    const rect = $wrapper.getBoundingClientRect();
    // 缩放的容器
    const canvas = document.querySelector('.topology-canvas');
    // 可以获取到 svg 的宽高
    const { width, height } = canvas.getBoundingClientRect();
    // eslint-disable-next-line radix
    const zoom = parseInt(document.querySelector('.topology-tools-percent').innerHTML) / 100;
    // 缩放后画布的中心点,还是需要用缩放前的比例计算中心点
    const centerX = width / zoom / 2;
    const centerY = height / zoom / 2;
    return {
        centerX,
        centerY,
        rect,
        zoom,
        scrollLeft: $wrapper.scrollLeft,
        scrollTop: $wrapper.scrollTop
    };
};

/**
 * 获取相对画布的坐标
 * TODO: 缩放 scale 之后 position 计算有问题，暂时没有想到可以绕过去的方法
 * https://github.com/react-dnd/react-dnd/issues/1730
 * fix：核心逻辑，缩放后以 1 的比例去思考
 * 计算公式：找到中心点的位置 +（鼠标位置 - 中心点的距离) / 缩放）+（一些 dom 的偏离）/ 缩放
 */
export const computeCanvasPo = (position: IPosition, $wrapper: HTMLDivElement) => {
    const {
        centerX, centerY, rect, zoom, scrollLeft, scrollTop
    } = computeCanvasPoHelper($wrapper);
    const po = {
        x: centerX + (position.x - centerX) / zoom + (scrollLeft + window.pageXOffset - rect.left) / zoom,
        y: centerY + (position.y - centerY) / zoom + (scrollTop + window.pageYOffset - rect.top) / zoom,
    } as IPosition;
    return po;
};

export const multiComputeCanvasPo = (positionList: IPosition[], $wrapper: HTMLDivElement) => {
    const {
        centerX, centerY, rect, zoom, scrollLeft, scrollTop
    } = computeCanvasPoHelper($wrapper);
    return positionList.map((position) => {
        const po = {
            x: centerX + (position.x - centerX) / zoom + (scrollLeft + window.pageXOffset - rect.left) / zoom,
            y: centerY + (position.y - centerY) / zoom + (scrollTop + window.pageYOffset - rect.top) / zoom,
        } as IPosition;
        return po;
    });
};

/** 计算连接线路径 */
export const computeLinePath = (start: IPosition, end: IPosition, lineOffsetY = 0)/* istanbul ignore next */ => {
    // const svgPath = path();
    // // 直线绘制方式（代码暂时保留）
    // const distance = Math.abs(start.y - end.y) * 0.5 + start.y;
    // const polyLineY = end.y - start.y < 0 ? end.y - 40 : distance;
    // const verticalPolyPoint = {
    //     x: start.x,
    //     y: polyLineY,
    // };
    // const horizontalPolyPoint = {
    //     x: end.x,
    //     y: polyLineY,
    // };
    // // A collection of points for drawing a line
    // const linePoints = [
    //     [{ ...start, y: end.y - start.y < 0 ? start.y - 20 : start.y }, verticalPolyPoint],
    //     [verticalPolyPoint, horizontalPolyPoint],
    //     [horizontalPolyPoint, end],
    // ];
    // // eslint-disable-next-line
    // for (let [startPoint, endPoint] of linePoints) {
    //     svgPath.moveTo(startPoint.x, startPoint.y);
    //     svgPath.lineTo(endPoint.x, endPoint.y);
    // }
    // 弧线绘制方式
    const x = Math.abs(start.x - end.x);
    const y = Math.abs(start.y - end.y);
    if (x === 0 || y === 0) {
        return `
            M ${start.x} ${start.y}
            L ${end.x} ${end.y}
        `;
    }
    let dir: number;
    let p1: string;
    let p2: string;

    if (end.y < start.y) {
        const offsetY = 80;
        const offsetX = 40;
        dir = end.x - start.x > 0 ? 1 : -1;
        p1 = `${start.x + dir * offsetX}, ${start.y + offsetY}`;
        p2 = `${end.x - dir * offsetX}, ${end.y - offsetY}`;
        return `
            M ${start.x} ${start.y - lineOffsetY}
            C ${p1} ${p2} ${end.x} ${end.y}
        `;
    }
    const OffsetXP1 = +(1 / 12 * x).toFixed(0);
    const OffsetXP2 = +(11 / 12 * x).toFixed(0);
    const offsetYP1 = +(1 / 3 * y).toFixed(0);
    const offsetYP2 = +(2 / 3 * y).toFixed(0);
    dir = start.x - end.x > 0 ? -1 : 1;
    p1 = `${start.x + dir * OffsetXP1}, ${start.y + offsetYP1}`;
    p2 = `${start.x + dir * OffsetXP2}, ${start.y + offsetYP2}`;
    return `
        M ${start.x} ${start.y - lineOffsetY}
        C ${p1} ${p2} ${end.x} ${end.y}
    `;
};

/** 计算三角形路径 */
export const computeTrianglePath = (start: IPosition, width: number) => `
    M ${start.x} ${start.y}
    l ${width / 2} 0
    l ${-width / 2} ${width}
    l ${-width / 2} ${-width}
    Z
`;

export const getNodeSize = (dom: string | HTMLElement) => {
    if (['string', 'number'].indexOf(typeof dom) > -1) {
        // eslint-disable-next-line no-param-reassign
        dom = document.getElementById(`dom-map-${dom}`) as HTMLElement;
    }
    if (!dom) {
        return {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
        } as ClientRect;
    }
    return (dom as HTMLElement).getBoundingClientRect();
};

export const impactCheck = (point: IPosition, size: { width: number; height: number }, position: IPosition) => {
    const withinX = point.x >= position.x && point.x <= position.x + size.width;
    const withinY = point.y >= position.y && point.y <= position.y + size.height;
    return withinX && withinY;
};

/** 计算锚点位置 */
export const computeAnchorPo = (anchor: string, parentNode: ITopologyNode) => {
    const $anchor = document.getElementById(anchor);
    if (!$anchor) {
        return null;
    }
    const anchorSize = getNodeSize($anchor);
    const parentSize = getNodeSize(parentNode.id);
    const parentPosition = parentNode.position || { x: 0, y: 0 };
    const dX = anchorSize.left - parentSize.left;
    const dY = anchorSize.top - parentSize.top;
    const po = {
        x: parentPosition.x + dX + anchorSize.width / 2,
        y: parentPosition.y + dY + anchorSize.height,
    };
    if (Number.isNaN(po.x) || Number.isNaN(po.y)) {
        return null;
    }

    return po;
};

// 锚点始终位于节点底部
export const computeAnchorPoWithNodeBottom = (anchor: string, parentNode: ITopologyNode) => {
    const $anchor = document.getElementById(anchor);
    if (!$anchor) {
        return null;
    }
    const parentSize = getNodeSize(parentNode.id);
    const parentPosition = parentNode.position || { x: 0, y: 0 };
    const po = {
        x: parentPosition.x + parentSize.width / 2,
        y: parentPosition.y + parentSize.height,
    };
    if (Number.isNaN(po.x) || Number.isNaN(po.y)) {
        return null;
    }

    return po;
};

export const computeMaxAndMin = (nodes: ITopologyNode[]) => {
    // @ts-ignore
    if (!nodes.length || nodes.find(item => !item.position || [item.position.x, item.position.y].includes(undefined))) {
        return null;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    nodes.forEach(({ position, id }) => {
        const nodeSize = getNodeSize(id);
        const { x, y } = position;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + nodeSize.width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + nodeSize.height);
    });
    return {
        minX,
        maxX,
        minY,
        maxY
    };
};

export const getMaxAndMinNodeId = (nodes: ITopologyNode[]) => {
    // @ts-ignore
    if (!nodes.length || nodes.find(item => !item.position || [item.position.x, item.position.y].includes(undefined))) {
        return null;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minXId = null;
    let maxXId = null;
    let minYId = null;
    let maxYId = null;

    nodes.forEach(({ position, id }) => {
        const { x, y } = position;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        if (x === minX) {
            minXId = id;
        }
        if (x === maxX) {
            maxXId = id;
        }
        if (y === minY) {
            minYId = id;
        }
        if (y === maxY) {
            maxYId = id;
        }
    });
    return {
        minXId,
        maxXId,
        minYId,
        maxYId
    };
};

/**
 * TODO: 缩放之后影响到计算判断, viewHeight 可视化高度区分判断是画布高度还是屏幕高度
 * 判断节点是否位于可视区域内
 * @param nodeId
 * @param doc
 * @returns
 */
export const isInViewPort = (nodeId, doc) => {
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    // const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewHeight = document.documentElement.offsetHeight;
    const {
        top,
        right,
        bottom,
        left,
    } = doc.getElementById(`topology-node-${nodeId}`).getBoundingClientRect();
    return (
        top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight
    );
};

export const computeContentCenter = (nodes: ITopologyNode[]) => {
    if (!computeMaxAndMin(nodes)) return null;
    const {
        minX, maxX, minY, maxY
    } = computeMaxAndMin(nodes);
    return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
    };
};

/**
 * 滚动 Y 轴距离顶部距离
 */
export const computeContentPostionY = (nodes: ITopologyNode[]) => {
    if (!computeMaxAndMin(nodes)) return null;
    const {
        minX, maxX, minY
    } = computeMaxAndMin(nodes);
    return {
        x: (minX + maxX) / 2,
        y: minY,
    };
};

/** 计算节点连接处 */
export const computeNodeInputPo = (node: ITopologyNode) => {
    const $node = document.getElementById(`dom-map-${node.id}`);
    if (!$node) {
        return null;
    }
    const nodeSize = getNodeSize($node);
    // eslint-disable-next-line no-param-reassign
    node.position = node.position || { x: 0, y: 0 };
    const po = {
        x: node.position.x + nodeSize.width / 2,
        y: node.position.y,
    };
    if (Number.isNaN(po.x) || Number.isNaN(po.y)) {
        return null;
    }
    return po;
};

/** 计算鼠标相对画布位置 */
export const computeMouseClientToCanvas = (clientX: number, clientY: number, $wrapper: HTMLDivElement) => {
    const rect = $wrapper.getBoundingClientRect();
    const dX = clientX - rect.left;
    const dY = clientY - rect.top;
    return {
        x: $wrapper.scrollLeft + dX,
        y: $wrapper.scrollTop + dY,
    };
};

type GetField = (obj: object) => string;
export const createHashFromObjectArray = (arr: object[], field: string | GetField) => arr.reduce(
    (pre, cur: object) => {
        const key = typeof field === 'string' ? cur[field] : field(cur);
        return { ...pre, [key]: cur };
    },
    {},
);

/**
 * 判断对象是否存在一组 matchKey: matchValue
 * @param obj
 * @param matchKey
 * @param matchValue
 * @returns
 */
export const isMatchKeyValue = (obj, matchKey?, matchValue?) => {
    let isMatch = false;
    const loop = (param) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in param) {
            if (Object.prototype.toString.call(param[key]) === '[object Object]' && param[key] !== null) {
                loop(param[key]);
            } else {
                // eslint-disable-next-line no-lonely-if
                if (key === matchKey) {
                    isMatch = (param[key] === matchValue);
                }
            }
        }
    };
    loop(obj);
    return isMatch;
};

export const TOPOLOGY_NODE_PREFIX = 'topology-node-';

export const getRealNodeDom = (id: string) => document.getElementById(`${TOPOLOGY_NODE_PREFIX}${id}`);
