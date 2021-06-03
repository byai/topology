// import { path } from 'd3-path';
import {
    IPosition,
    ITopologyNode,
} from '../declare';

export const shouldAutoLayout = (nodes: ITopologyNode[]) => {
    if (nodes.length === 0) {
        return false;
    }
    return !nodes.find(item => !!item.position);
};

/** 获取相对画布的坐标 */
export const computeCanvasPo = (position: IPosition, $wrapper: HTMLDivElement) => {
    // 当窗口有滚动时，需加上窗口的滚动
    const rect = $wrapper.getBoundingClientRect();
    return {
        x: position.x + $wrapper.scrollLeft + window.pageXOffset - rect.left,
        y: position.y + $wrapper.scrollTop + window.pageYOffset - rect.top,
    } as IPosition;
};

/** 计算连接线路径 */
export const computeLinePath = (start: IPosition, end: IPosition)/* istanbul ignore next */ => {
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
            M ${start.x} ${start.y}
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
        M ${start.x} ${start.y}
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

export const computeContentCenter = (nodes: ITopologyNode[]) => {
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
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
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
