import React, { HTMLAttributes } from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { SelectMode } from '../../utils/selectNodes';
import { IPosition, ITopologyNode, ITopologyLine, IWrapperOptions, ITopologyData, ITopologyContext, ValuesOf, ChangeType } from '../../declare';
import './index.less';
export interface ITopologyProps {
    data: ITopologyData;
    readOnly?: boolean;
    snapline?: boolean;
    showBar?: boolean;
    showCenter?: boolean;
    showLayout?: boolean;
    showDownload?: boolean;
    downloadImg?: (scopeType?: 'global' | 'selected', download?: boolean, name?: string) => void;
    canConnectMultiLines?: boolean;
    overlap?: boolean;
    overlapCallback?: () => void;
    overlapOffset?: {
        offsetX?: number;
        offsetY?: number;
    };
    prevNodeStyle?: {
        border?: string;
        background?: string;
    };
    isReduceRender?: boolean;
    autoLayout?: boolean;
    customPostionHeight?: number;
    lineLinkageHighlight?: boolean;
    lineColor?: {
        [x: string]: string;
    };
    lineTextColor?: {
        [x: string]: string;
    };
    lineOffsetY?: number;
    startPointAnchorId?: string;
    lineTextMap?: {
        [x: string]: string;
    };
    scaleNum: number;
    showText?: (start: string) => boolean;
    lineTextDecorator?: (text: {
        x: number;
        y: number;
    }, line: ITopologyLine) => React.ReactNode;
    onChange?: (data: ITopologyData, type: ChangeType) => void;
    onSelect?: (data: ITopologyData) => void;
    getInstance?: (instance: Topology) => void;
    renderTreeNode?: (data: ITopologyNode, wrappers: IWrapperOptions) => React.ReactNode;
    sortChildren?: (parent: ITopologyNode, children: ITopologyNode[]) => ITopologyNode[];
    connectDropTarget?: ConnectDropTarget;
    /** 组合节点 */
    hasCombineNode?: boolean;
    combineIdSet?: Set<string>;
    cancelCombine?: (id: string) => void;
    combineNode?: (ids: string[]) => string;
    onShowMenu?: () => void;
    renderBoxSelectionTool?: () => React.ReactNode;
    autoRemoveSelected?: boolean | ((e: MouseEvent) => void);
    customToolboxList?: {
        wrapperProps?: HTMLAttributes<HTMLDivElement>;
        content: React.ReactNode;
        tooltip: string;
    }[];
}
export interface ITopologyState {
    context: ITopologyContext;
    scaleNum: number;
    boxSelectionInfo: {
        initX: number;
        initY: number;
        x: number;
        y: number;
        status?: 'drag' | 'static' | 'none';
    } | undefined;
    draggingId: string;
    realDragNodeDomList?: Element[] | null;
    boxVisibleFlag?: boolean;
    loading: boolean;
    alignmentLines: any;
}
interface NodeSizeCache {
    [id: string]: {
        width: number;
        height: number;
    };
}
declare class Topology extends React.Component<ITopologyProps, ITopologyState> {
    $topology: HTMLDivElement | null;
    $wrapper: HTMLDivElement | null;
    $canvas: HTMLDivElement | null;
    nodeSizeCache: NodeSizeCache;
    state: ITopologyState;
    dragCanvasPo: IPosition | null;
    shouldAutoLayout: boolean;
    constructor(props: ITopologyProps);
    componentWillMount(): void;
    componentDidMount(): void;
    getAutoClearSelectedFn(): (e: MouseEvent) => void;
    componentWillReceiveProps(nextProps: ITopologyProps): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    onChange: (data: ITopologyData, type: ChangeType) => void;
    defaultScaleNum: number;
    scaleNum: number;
    clearSelectedWhenClickOutside: (e: MouseEvent) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetScale: () => void;
    scrollCanvasToCenter: () => void;
    /**
     *  定位至画布顶部距离
     * @returns
     */
    scrollCanvasToPositionY: () => void;
    cacheNodeSize: () => void;
    impactCheck: (endPo: IPosition, startPo: IPosition, id?: string) => string;
    clearSelectData: () => void;
    autoLayout: () => void;
    initDomEvents: () => void;
    removeDomEvents: () => void;
    getBoundary: (elements: Element[]) => {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    getRealNodeDomByIdList: (ids: string[]) => HTMLElement[];
    generateBoxByRealSelectedNodeDom: (elements: Element[] | null, offset?: number) => void;
    generateBoxByBoundary: (boundary: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }, offset?: number) => void;
    generateBoxBySelectedNode: (nodes?: ITopologyNode[], offset?: number) => void;
    handleKeydown: (e: KeyboardEvent) => void;
    deleteItem: () => void;
    setDraggingId: (id: any) => void;
    setContext: (values: ValuesOf<ITopologyContext>, callback?: Function) => void;
    refreshSelectNode: (data: ITopologyData) => void;
    selectNode: (node: ITopologyNode, mode: SelectMode) => {
        nodes: ITopologyNode[];
        lines: ITopologyLine[];
    };
    selectNodesForSelection: () => void;
    selectLine: (data: ITopologyData) => void;
    dragCanvas: (clientX: number, clientY: number) => void;
    editLine: (clientX: number, clientY: number) => void;
    handleHoverCurrentNode: (node: any) => void;
    isSelected: (id: string) => boolean;
    clearHoverCurrentNode: () => void;
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement | SVGCircleElement>) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    samePostionLinesLength: (curLine: ITopologyLine) => number;
    getLineRepeatIndex: (curLine: any) => {
        index?: number;
    };
    inSelection: (selectionPositionGroup: [IPosition, IPosition], nodePositionGroup: [IPosition, IPosition]) => boolean;
    getBoxPositionGroup: () => [IPosition, IPosition];
    getNodeDomList: () => Element[];
    getCombineNode: (combineId: string) => ITopologyNode[];
    getShouldSelectedNodeList: () => {
        nativeNodeList: Element[];
        selectedNodeList: ITopologyNode[];
        boxPositionGroup: [IPosition, IPosition];
    };
    couldDispatchContextMenuEvent: (e: React.MouseEvent<HTMLDivElement>) => boolean;
    closeBoxSelection: () => void;
    showBoxSelection: () => void;
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
    clearMouseEventData: () => void;
    handleLineDraw: (startId: string) => void;
    handleNodeDraw: (nodeInfoList: [string, IPosition][], childPosMap?: {
        [key: string]: {
            x: number;
            y: number;
        };
    }) => void;
    handleCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    renderNodes: () => React.JSX.Element[];
    renderDomMap: (props?: ITopologyProps) => void;
    renderLines: () => React.JSX.Element;
    findScale: (clonegraph: any) => Promise<number>;
    /**
     * @param scopeType 下载区域类型（整个画布数据|选中的数据）
     * @param openDownload 是否开启下载
     * @param imgName 图片名称
     * @returns
     */
    downloadImg: (scopeType?: 'global' | 'selected', openDownload?: boolean, imgName?: string) => Promise<string>;
    /**
     * 整个画布截图
     */
    getImageBase64Url: () => Promise<string>;
    /**
     * 选中数据截图
     */
    getImageBase64UrlWithSelectedData: () => Promise<string>;
    locateNodeById: (id: any) => void;
    renderToolBars: () => React.JSX.Element;
    handleSelectAll: () => void;
    handleDeselectAll: () => void;
    /**
     * Check whether the drag node overlaps
     * @param nodeInfo [string, IPosition][]
     * @returns
     */
    validateIsOverlap: (nodeInfo: [string, IPosition][]) => boolean;
    multiValidateIsOverlap: (drawId: any, pos: any) => boolean;
    setRealDragNodeDomList: (element?: Element[] | null) => void;
    setAlignmentLines: (alignmentLines: any) => void;
    getNodePosition: (monitor: any, nodeDom: any, isChild?: any) => {};
    render(): any;
}
declare const _default: any;
export default _default;
