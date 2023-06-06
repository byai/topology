import { IPosition, ITopologyNode } from '../declare';
export declare const shouldAutoLayout: (nodes: ITopologyNode[]) => boolean;
/**
 * 获取相对画布的坐标
 * TODO: 缩放 scale 之后 position 计算有问题，暂时没有想到可以绕过去的方法
 * https://github.com/react-dnd/react-dnd/issues/1730
 * fix：核心逻辑，缩放后以 1 的比例去思考
 * 计算公式：找到中心点的位置 +（鼠标位置 - 中心点的距离) / 缩放）+（一些 dom 的偏离）/ 缩放
 */
export declare const computeCanvasPo: (position: IPosition, $wrapper: HTMLDivElement) => IPosition;
export declare const multiComputeCanvasPo: (positionList: IPosition[], $wrapper: HTMLDivElement) => IPosition[];
/** 计算连接线路径 */
export declare const computeLinePath: (start: IPosition, end: IPosition, lineOffsetY?: number) => string;
/** 计算三角形路径 */
export declare const computeTrianglePath: (start: IPosition, width: number) => string;
export declare const getNodeSize: (dom: string | HTMLElement) => DOMRect;
export declare const impactCheck: (point: IPosition, size: {
    width: number;
    height: number;
}, position: IPosition) => boolean;
/** 计算锚点位置 */
export declare const computeAnchorPo: (anchor: string, parentNode: ITopologyNode) => {
    x: number;
    y: number;
};
export declare const computeMaxAndMin: (nodes: ITopologyNode[]) => {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};
export declare const getMaxAndMinNodeId: (nodes: ITopologyNode[]) => {
    minXId: any;
    maxXId: any;
    minYId: any;
    maxYId: any;
};
/**
 * TODO: 缩放之后影响到计算判断, viewHeight 可视化高度区分判断是画布高度还是屏幕高度
 * 判断节点是否位于可视区域内
 * @param nodeId
 * @param doc
 * @returns
 */
export declare const isInViewPort: (nodeId: any, doc: any) => boolean;
export declare const computeContentCenter: (nodes: ITopologyNode[]) => {
    x: number;
    y: number;
};
/**
 * 滚动 Y 轴距离顶部距离
 */
export declare const computeContentPostionY: (nodes: ITopologyNode[]) => {
    x: number;
    y: number;
};
/** 计算节点连接处 */
export declare const computeNodeInputPo: (node: ITopologyNode) => {
    x: number;
    y: number;
};
/** 计算鼠标相对画布位置 */
export declare const computeMouseClientToCanvas: (clientX: number, clientY: number, $wrapper: HTMLDivElement) => {
    x: number;
    y: number;
};
type GetField = (obj: object) => string;
export declare const createHashFromObjectArray: (arr: object[], field: string | GetField) => object;
/**
 * 判断对象是否存在一组 matchKey: matchValue
 * @param obj
 * @param matchKey
 * @param matchValue
 * @returns
 */
export declare const isMatchKeyValue: (obj: any, matchKey?: any, matchValue?: any) => boolean;
export declare const TOPOLOGY_NODE_PREFIX = "topology-node-";
export declare const getRealNodeDom: (id: string) => HTMLElement;
export {};
