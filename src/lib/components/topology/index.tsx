/* eslint-disable */
import React, { HTMLAttributes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropTarget, ConnectDropTarget } from 'react-dnd';
import _, { debounce } from 'lodash';
import classnames from 'classnames';
import html2canvas from 'html2canvas';
import selectNodes, { getLinesFromNode, SelectMode } from '../../utils/selectNodes';
import { Provider, defaultContext } from '../context';
import NodeWrapper from '../node-wrapper';
import Line from '../line';
import LineText from '../line/lineText';
import Minimap from '../minimap';
import {
  cubicBezierAABB
} from 'bezier-intersect';

import {
    KeyCode,
    NodeTypes,
    IPosition,
    ITopologyNode,
    ITopologyLine,
    IWrapperOptions,
    ITopologyData,
    ITopologyContext,
    // eslint-disable-next-line import/named
    ValuesOf,
    ChangeType,
    LineEditType,
} from '../../declare';
import {
    computeCanvasPo,
    impactCheck,
    computeAnchorPo,
    computeNodeInputPo,
    computeContentCenter,
    computeContentPostionY,
    createHashFromObjectArray,
    getNodeSize,
    shouldAutoLayout,
    getRealNodeDom,
    getMaxAndMinNodeId,
    isInViewPort,
    computeMaxAndMin,
    isMatchKeyValue,
    DagreDirection,
    computeAnchorPoWithNodeBottom,
} from '../../utils';
// import layoutCalculation from '../../utils/layoutCalculation';
import computeLayout from '../../utils/computeLayout';
import deleteSelectedData from '../../utils/deleteSelectedData';
import config from '../../config';
import './index.less';
import Selection from '../selection';
import SnapLine from '../snapline';
import { isolatedNode } from '../../utils/tree';

export interface AutoLayoutOptions {
    preprocess?: (data: ITopologyData) => ITopologyData;
    resultProcess?: (data: ITopologyData) => ITopologyData;
    rankDir?: DagreDirection;
}

export interface ITopologyProps {
    data: ITopologyData; // 数据 { nodes: []; lines: [] }
    readOnly?: boolean; // 只读模式，为true时不可编辑
    snapline?: boolean; // 是否显示辅助对齐线，默认现实
    showBar?: boolean; // 是否显示工具栏
    showCenter?: boolean; // 是否显示工具栏中的定位中心
    showLayout?: boolean; // 是否显示工具栏中的自动布局
    showDownload?: boolean; // 是否显示工具栏中的下载图片
    showMinimap?: boolean; // 是否显示小地图
    downloadImg?: (scopeType?: 'global' | 'selected', download?: boolean, name?: string) => void;
    allowNodeInsertOnEdge?: boolean; // 是否开启拖拽节点到线中间进行节点插入
    canConnectMultiLines?: boolean; // 控制一个锚点是否可以连接多条线
    overlap?: boolean; // 是否允许节点覆盖，默认允许，设置 true 时不允许
    overlapCallback?: () => void; // overlap 回调
    overlapOffset?: {
        offsetX?: number;
        offsetY?: number;
    };
    prevNodeStyle?: {
        // 暂时支持这两个属性
        border?: string;
        background?: string;
    };
    isReduceRender?: boolean;
    autoLayout?: boolean; // 自动布局，当数据中没有position属性时将自动计算布局。
    customPostionHeight?: number; // 当设置 customPostionHeight 时，画布距离顶部 customPostionHeight
    lineLinkageHighlight?: boolean; // hover 节点线条是否联动高亮
    lineColor?: {
        [x: string]: string;
    }; // 线条颜色映射对象 eg: {'锚点1': '#82BEFF', '锚点2': '#FFA39E'}
    lineTextColor?: {
        [x: string]: string;
    }; // 线条上文字颜色映射对象 eg: {'锚点1': '#82BEFF', '锚点2': '#FFA39E'}
    lineOffsetY?: number; // 线条起始点向上偏移量
    startPointAnchorId?: string; // 保持所有线条起始点与 startPointAnchorId 线条一致
    anchorPlacement?: string; // 锚点位置
    selectionAutoScroll?: boolean; // 是否开启框选至边缘时画布自动滚动
    lineTextMap?: {
        [x: string]: string; // 线条上文字与 anchorId 映射对象 eg: {'anchorId1': '锚点1', 'anchorId2': '锚点2'}
    };
    scaleNum: number;
    showText?: (start: string) => boolean;
    lineTextDecorator?: (text: {
        x: number;
        y: number;
    }, line: ITopologyLine) => React.ReactNode;
    onChange?: (data: ITopologyData, type: ChangeType) => void;
    onSelect?: (data: ITopologyData) => void;
    getInstance?: (instance: Topology) => void; // 返回组件实例，用于调用组件内部的方法。
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
    customToolboxList?: { wrapperProps?: HTMLAttributes<HTMLDivElement>; content: React.ReactNode; tooltip: string; }[];
    renderMinimapChild?: (params) => React.ReactNode;
    autoLayoutOption?: AutoLayoutOptions;
}

export interface ITopologyState {
    context: ITopologyContext;
    scaleNum: number;
    boxSelectionInfo: {
        initX: number;
        initY: number;
        x: number;
        y: number;
        // 记录框选时画布滚动距离
        initScrollLeft?: number;
        initScrollTop?: number;
        scrollLeft?: number;
        scrollTop?: number;
        status?: 'drag' | 'static' | 'none';
    } | undefined;
    draggingId: string;
    realDragNodeDomList?: Element[] | null;
    boxVisibleFlag?: boolean;
    loading: boolean;
    alignmentLines: any;
}

interface NodeSizeCache {
    [id: string]: { width: number; height: number };
}

interface IPosMap {
    T1: {
        x: number;
        y: number;
    };
    T2: {
        x: number;
        y: number;
    };
}

const MAX_SCALE = 2;
const MIN_SCALE = 0.1;
const DRAG_CLASS = 'topology-canvas-drag';
const initialTopologyState = {
    context: defaultContext,
    scaleNum: 1,
    draggingId: null,
    loading: false,
    alignmentLines: {}
} as ITopologyState;

class Topology extends React.Component<ITopologyProps, ITopologyState> {
    $topology: HTMLDivElement | null;

    $wrapper: HTMLDivElement | null;

    $canvas: HTMLDivElement | null;

    nodeSizeCache: NodeSizeCache = {};

    state: ITopologyState = initialTopologyState;

    dragCanvasPo: IPosition | null = null;

    shouldAutoLayout: boolean = false;

    hoverThreshold = this.props?.data?.nodes?.length >= 200 ? 350 : 40;

    boxSelectionRef: any;

    constructor(props: ITopologyProps) {
        super(props);
        this.shouldAutoLayout = shouldAutoLayout(props.data.nodes);
    }

    componentWillMount() {
        this.renderDomMap();
        const autoClearSelectedFn = this.getAutoClearSelectedFn();
        if (autoClearSelectedFn) {
            document.body.removeEventListener('click', autoClearSelectedFn);
        }
    }

    componentDidMount() {
        const {
            getInstance, readOnly, customPostionHeight, scaleNum
        } = this.props;
        this.editLine = _.throttle(this.editLine, this.hoverThreshold);
        if (!readOnly) {
            this.initKeydownEvent();
        }
        this.initWheelEvent();

        //  $wrapper 赋值
        // this.$wrapper = document.querySelector('.minimap-container-scroll');

        if (this.$wrapper) {
            // 自定义节点距离画布顶部高度
            if (customPostionHeight) {
                this.scrollCanvasToPositionY();
            } else {
                this.scrollCanvasToCenter();
            }
            const autoClearSelectedFn = this.getAutoClearSelectedFn();
            if (autoClearSelectedFn) {
                document.body.addEventListener('click', autoClearSelectedFn);
            }
        }

        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout(this.props.autoLayoutOption);
        }

        if (getInstance) {
            getInstance(this);
        }

        this.setState(() => {
            this.scaleNum = scaleNum === undefined ? 1 : scaleNum;
            // 记录默认缩放的值，resetScale 时候用
            this.defaultScaleNum = this.scaleNum;
            return { scaleNum };
        });
    }

    getAutoClearSelectedFn() {
        // eslint-disable-next-line react/destructuring-assignment
        if (!this.props.autoRemoveSelected) {
            return undefined;
        }
        // eslint-disable-next-line react/destructuring-assignment
        return typeof this.props.autoRemoveSelected === 'function' ? this.props.autoRemoveSelected : this.clearSelectedWhenClickOutside;
    }

    componentWillReceiveProps(nextProps: ITopologyProps) {
        const { readOnly } = this.props;
        const { readOnly: nextReadOnly } = nextProps;
        this.renderDomMap(nextProps);
        this.shouldAutoLayout = shouldAutoLayout(nextProps.data.nodes);
        if (readOnly && !nextReadOnly) {
            this.initKeydownEvent();
        }
        if (!readOnly && nextReadOnly) {
            this.removeKeydownEvent();
        }
    }

    componentDidUpdate() {
        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout(this.props.autoLayoutOption);
        }
    }

    componentWillUnmount() {
        // @ts-ignore
        if (typeof this.editLine.cancel === "function") {
            // @ts-ignore
            this.editLine.cancel();
        }

        this.removeKeydownEvent();
        this.removeWheelEvent();
    }

    onChange = (data: ITopologyData, type: ChangeType) => {
        const { onChange } = this.props;
        if (!onChange) {
            return;
        }
        onChange(data, type);
    };

    defaultScaleNum = 1;

    scaleNum = 1;

    clearSelectedWhenClickOutside = (e: MouseEvent) => {
        if (this.$topology.contains(e.target as Node)) {
            return;
        }
        this.clearSelectData();
    }

    zoomIn = () => {
        this.setState((prevState: ITopologyState) => {
            const scaleNum = prevState.scaleNum > MIN_SCALE + 0.1 ? prevState.scaleNum - 0.1 : MIN_SCALE;
            this.scaleNum = scaleNum;
            return { scaleNum };
        });
        this.setDraggingId(null);
    };

    zoomOut = () => {
        this.setState((prevState: ITopologyState) => {
            const scaleNum = prevState.scaleNum < MAX_SCALE ? prevState.scaleNum + 0.1 : MAX_SCALE;
            this.scaleNum = scaleNum;
            return { scaleNum };
        });
        this.setDraggingId(null);
    };

    resetScale = () => {
        this.setState(() => {
            const { defaultScaleNum } = this;
            this.scaleNum = defaultScaleNum;
            return { scaleNum: defaultScaleNum };
        });
        this.setDraggingId(null);
    }

    scrollCanvasToCenter = () => {
        if (!this.$wrapper || !this.$canvas) {
            return;
        }
        this.resetScale();
        const canvasSize = getNodeSize(this.$canvas);
        const wrapperSize = getNodeSize(this.$wrapper);
        const contentCenter = computeContentCenter(this.props.data.nodes);
        const canvasCenter = {
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
        };
        const defaultScrollTop = (canvasSize.height - wrapperSize.height) / 2;
        const defaultScrollLeft = (canvasSize.width - wrapperSize.width) / 2;
        if (!contentCenter) {
            this.$wrapper.scrollTop = defaultScrollTop;
            this.$wrapper.scrollLeft = defaultScrollLeft;
        } else {
            this.$wrapper.scrollTop = defaultScrollTop + (contentCenter.y - canvasCenter.y);
            this.$wrapper.scrollLeft = defaultScrollLeft + (contentCenter.x - canvasCenter.x);
        }
    };

    /**
     *  定位至画布顶部距离
     * @returns
     */
    scrollCanvasToPositionY = () => {
        if (!this.$wrapper || !this.$canvas) {
            return;
        }
        this.resetScale();
        const canvasSize = getNodeSize(this.$canvas);
        const wrapperSize = getNodeSize(this.$wrapper);
        const contentPosition = computeContentPostionY(this.props.data.nodes);
        const canvasCenter = {
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
        };
        const defaultScrollTop = (canvasSize.height - wrapperSize.height) / 2;
        const defaultScrollLeft = (canvasSize.width - wrapperSize.width) / 2;
        if (!contentPosition) {
            this.$wrapper.scrollTop = defaultScrollTop;
            this.$wrapper.scrollLeft = defaultScrollLeft;
        } else {
            this.$wrapper.scrollTop = contentPosition.y - this.props.customPostionHeight;
            this.$wrapper.scrollLeft = defaultScrollLeft + (contentPosition.x - canvasCenter.x);
        }
    };

    cacheNodeSize = () => {
        const {
            data: { nodes }
        } = this.props;
        // 已节点id为键值，缓存节点的宽和高，避免碰撞检测时频繁操作DOM
        this.nodeSizeCache = nodes.reduce(
            (pre: NodeSizeCache, cur: ITopologyNode) => ({
                ...pre,
                [cur.id]: getNodeSize(cur.id)
            }),
            {}
        );
    };

    impactCheck = (endPo: IPosition, startPo: IPosition, id?: string) => {
        const {
            data: { nodes, lines }
        } = this.props;
        const impactNode = nodes.find((item) => {
            if (!this.nodeSizeCache[item.id]) {
                this.nodeSizeCache[item.id] = getNodeSize(item.id);
            }
            return (
                this.nodeSizeCache[item.id]
                && impactCheck(
                    endPo,
                    this.nodeSizeCache[item.id],
                    item.position as IPosition
                )
            );
        });
        // 起点和终点是同一节点
        if (
            impactNode
            && impactCheck(
                startPo,
                this.nodeSizeCache[impactNode.id],
                impactNode.position as IPosition
            )
        ) {
            return null;
        }

        // 线已存在情况下
        const hasExistSameLine = impactNode && lines.find(item => item.start === id && item.end === impactNode.id);
        if (hasExistSameLine) return null;

        // 节点不可被连接
        if (impactNode && impactNode.canConnect === false) return null;

        return impactNode ? impactNode.id : null;
    };

    clearSelectData = (updated?: boolean) => {
        const {
            nodes, lines
        } = this.state.context.selectedData;
        if (!updated && nodes?.length === 0 && lines?.length === 0) return;
        this.setContext({ selectedData: { nodes: [], lines: [], }}, () => {
            const { onSelect } = this.props;
            if (onSelect) {
                onSelect(this.state.context.selectedData);
            }
        });
    }

    mergeArrays = (data, selectData) => {
        const newData = [...data];

        for (let i = 0; i < newData.length; i++) {
            const item = newData[i];
            const matchingItem = selectData.find((selectItem) => selectItem.id === item.id);
            if (matchingItem) {
            newData[i] = matchingItem;
            }
        }

        return newData;
    }

    // 针对框选中的节点自动布局
    autoLayoutForBoxSelection = (options?: AutoLayoutOptions) => {
        const { rankDir } = options ?? {};
        const { data, sortChildren } = this.props;
        const selectResult = {
            ...this.state.context.selectedData,
            nodes: computeLayout(this.state.context.selectedData, { sortChildren, rankDir, boxSelectionBoundary: this.boxSelectionRef?.state })
        };

        const newNodes = this.mergeArrays(data?.nodes, selectResult?.nodes);
        const result = {
            ...data,
            nodes: newNodes,
        }
        this.onChange(
            result,
            ChangeType.LAYOUT
        );
        // 更新框选位置，
        // setTimeout(() => {
        //     this.generateBoxBySelectedNode(this.state.context.selectedData.nodes);
        // }, 200)
        this.closeBoxSelection(); // 重新布局后立即更新框选区域位置会有延迟，先做 close 处理
    };

    autoLayout = (options?: AutoLayoutOptions) => {
        const { preprocess, resultProcess } = options ?? {};
        const { data, sortChildren } = this.props;
        const newData = preprocess ? preprocess(data) : data;
        this.resetScale();
        const result = {
            ...newData,
            nodes: computeLayout(newData, { sortChildren })
        };
        this.onChange(
            resultProcess ? resultProcess(result) : result,
            ChangeType.LAYOUT
        );
        this.clearSelectData(true); // refresh
        this.closeBoxSelection();
    };

    listenerWheel = (event) => {
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault(); // 阻止浏览器默认事件
            const deltaY = event.deltaY; // 获取垂直方向的滚动值

            // 根据滚动值进行相应的操作
            if (deltaY > 0) {
                // 向下滚动
                this.zoomIn()
            } else if (deltaY < 0) {
                if(parseInt(this.scaleNum as any) === MAX_SCALE) {
                    return;
                }
                // 向上滚动
                this.zoomOut()
            }

            // 调整画布坐标偏移，以便使缩放中心保持在鼠标位置
            if (!this.$wrapper || !this.$canvas) {
                return;
            }

        } else {
        }
    }

    initKeydownEvent = () => {
        window.addEventListener("keydown", this.handleKeydown);
    }

    removeKeydownEvent = () => {
        window.removeEventListener("keydown", this.handleKeydown);
    }

    initWheelEvent = () => {
        this.$wrapper.addEventListener("wheel", this.listenerWheel);
    }

    removeWheelEvent = () => {
        this.$wrapper.removeEventListener("wheel", this.listenerWheel);
    }

    getBoundary = (elements: Element[]) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        elements.forEach(e => {
            const { x, y, height, width } = e.getBoundingClientRect();
            minX = Math.min(x, minX);
            minY = Math.min(y, minY);
            maxX = Math.max(x + width, maxX);
            maxY = Math.max(y + height, maxY);
        });
        return {
            minX,
            minY,
            maxX,
            maxY
        }
    }

    getRealNodeDomByIdList = (ids: string[]) => {
        return ids.map(getRealNodeDom)
    }



    generateBoxByRealSelectedNodeDom = (elements: Element[] | null, offset=3) => {
        const boundary = this.getBoundary(elements || this.state.realDragNodeDomList);
        setTimeout(() => {
            this.generateBoxByBoundary(boundary, offset)
        }, 0)
    }

    generateBoxByBoundary = (boundary: { minX: number; minY: number; maxX: number; maxY: number }, offset=3) => {
        const { minX, minY, maxX, maxY } = boundary;
        this.setState({
            boxSelectionInfo: {
                initX: minX - offset,
                initY: minY - offset,
                x: maxX + offset,
                y: maxY + offset,
                status: 'static',
            }
        })
    }

    generateBoxBySelectedNode = (nodes?: ITopologyNode[], offset?: number) => {
        nodes = nodes || this.state.context.selectedData.nodes;
        offset = offset || 3;
        if (nodes.length === 0) {
            this.setState({
                boxSelectionInfo: null
            })
            return;
        }
        this.generateBoxByRealSelectedNodeDom(this.getRealNodeDomByIdList(nodes.map(n => n.id)), offset);
    }

    handleKeydown = (e: KeyboardEvent) => {
        // eslint-disable-next-line
        const { classList = [] } = e.target as any;
        // 左侧的搜索输入框回删事件不触发话术更改
        if (classList[0] === "ant-input") {
            return;
        }
        switch (e.keyCode) {
            case KeyCode.BACKSPACE:
            case KeyCode.DELETE:
                this.deleteItem();
                break;
            default:
                break;
        }
    };

    deleteItem = () => {
        const { data } = this.props;
        const { selectedData, selectedData: { nodes, lines } } = this.state.context;
        if (nodes?.length === 0 && lines?.length === 0) return;
        this.onChange(
            deleteSelectedData(data, selectedData),
            ChangeType.DELETE
        );
        this.closeBoxSelection();
    };

    setDraggingId = (id) => {
        this.setState({
            draggingId: id,
        });
    }

    setContext = (values: ValuesOf<ITopologyContext>, callback?: Function) => {
        const { context } = this.state;
        this.setState({ context: { ...context, ...values } }, () => {
            if (callback) {
                callback();
            }
        });
    };

    refreshSelectNode = (data: ITopologyData) => {
        const {
            context: { selectedData }
        } = this.state;
        const onSelect = this.props.onSelect;
        const idSet = new Set(selectedData.nodes.map(item => item.id));
        const newNodeInfo = data.nodes.filter(n => idSet.has(n.id));
        const newInfo = {
            nodes: newNodeInfo,
            lines: selectedData.lines,
        };
        this.setContext({
            selectedData: newInfo,
        }, () => {
            if (onSelect) {
                onSelect(newInfo);
            }
        })
    }

    selectNode = (node: ITopologyNode, mode: SelectMode) => {
        const { data, onSelect } = this.props;
        const {
            context: { selectedData }
        } = this.state;
        const selectNodesId = selectedData.nodes.map(item => item.id);
        if (
            mode === SelectMode.RIGHT_NORMAL
            && selectNodesId.indexOf(node.id) !== -1
        ) {
            onSelect(selectedData);
            return selectedData;
        }
        const selectData = selectNodes({ data, selectedData })({
            node,
            mode
        });
        this.setContext(
            {
                selectedData: selectData,
            },
            () => {
                if (mode === SelectMode.BOX_SELECTION) {
                    this.generateBoxBySelectedNode(this.state.context.selectedData.nodes);
                }
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            }
        );
        return selectData;
    };

    selectNodesForSelection = () => {

    }

    selectLine = (data: ITopologyData) => {
        this.setContext(
            {
                selectedData: data
            },
            () => {
                const { onSelect } = this.props;
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            }
        );
    };

    dragCanvas = (clientX: number, clientY: number) => {
        if (!this.$wrapper) {
            return;
        }
        const dX = this.dragCanvasPo!.x - clientX;
        const dY = this.dragCanvasPo!.y - clientY;
        this.dragCanvasPo = { x: clientX, y: clientY };
        this.$wrapper.scrollTop = this.$wrapper.scrollTop + dY;
        this.$wrapper.scrollLeft = this.$wrapper.scrollLeft + dX;
    };

    editLine = (clientX: number, clientY: number) => {
        const { activeLine } = this.state.context;
        if (!this.$wrapper || !activeLine) {
            return;
        }

        const clientPo = computeCanvasPo(
            {
                x: clientX,
                y: clientY,
            },
            this.$wrapper
        );
        const impactNode = this.impactCheck(
            clientPo,
            activeLine![
                activeLine.type === LineEditType.EDIT_START ? "end" : "start"
            ]
        );
        this.setContext({
            impactNode,
            activeLine: {
                ...activeLine,
                [activeLine.type]: clientPo
            }
        });
    };

    handleHoverCurrentNode = (node) => {
        this.setContext({
            hoverCurrentNode: node
        });
    }

    isSelected = (id: string) => {
        const {
            context: { selectedData }
        } = this.state;
        return selectedData.nodes.some(item => item.id === id);
    }

    clearHoverCurrentNode = () => {
        this.setContext({
            hoverCurrentNode: null
        });
    }

    handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement | SVGCircleElement>
    ) => {
        const { boxSelectionInfo } = this.state
        /**
         * 框选时鼠标如果移出容器后触发mouseUp，重新移回容器首次mouseDown不执行操作，之后自动触发mouseUp，完成框选
         */
        if (boxSelectionInfo?.status === 'drag') {
            return
        }

        /**
         * 不在节点上时方可触发框选
         */
        if (e.button === 2 && !this.isEmitByNodeWrapper(e)) { // 检查是否右键
            this.setState({
                boxSelectionInfo: {
                    initScrollTop: this.$wrapper.scrollTop,
                    initScrollLeft: this.$wrapper.scrollLeft,
                    initX: e.clientX,
                    initY: e.clientY,
                    x: e.clientX,
                    y: e.clientY,
                    status: 'drag',
                }
            });
            return;
        }
        // @ts-ignore
        const itemType = e.target.getAttribute("data-type");
        // @ts-ignore
        const { className } = e.target;
        const getClickType = () => {
            // @ts-ignore
            if (
                // @ts-ignore
                [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(
                    itemType || ""
                )
            ) {
                return "CLICK_LINE_POINT";
            } else if (
                typeof className === "string"
                && className.includes("topology-canvas")
            ) {
                return "CLICK_CANVAS";
            }
            return "";
        };
        switch (getClickType()) {
            case "CLICK_CANVAS":
                this.dragCanvasPo = { x: e.clientX, y: e.clientY };
                // this.$topology
                this.$canvas.classList.add(DRAG_CLASS);
                break;
            case "CLICK_LINE_POINT":
                if (this.props.readOnly) {
                    break;
                }
                try {
                    // @ts-ignore
                    const jsonStr = e.target.getAttribute("data-json");
                    if (typeof jsonStr !== "string" || !jsonStr) {
                        throw new Error("线段起点无数据");
                    }
                    const { origin, po } = JSON.parse(jsonStr);
                    this.setContext({
                        linking: true,
                        activeLine: {
                            origin,
                            start: po.start,
                            end: po.end,
                            type: itemType
                        }
                    });
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.log(err);
                }
                break;
            default:
                break;
        }
    };

    handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { selectionAutoScroll = false } = this.props;
        e.persist();
        if (!!this.state.boxSelectionInfo && this.state.boxSelectionInfo.status === 'drag') {
            this.setState((prev) => {
                return {
                    boxSelectionInfo: {
                        ...prev.boxSelectionInfo,
                        x: e.clientX,
                        y: e.clientY,
                        scrollTop: this.$wrapper.scrollTop,
                        scrollLeft: this.$wrapper.scrollLeft
                    }
                }
            });
            if(!selectionAutoScroll) return;
            const wrapperRect = this.$wrapper.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const wrapperScrollLeft = wrapperRect.left;
            const wrapperScrollTop = wrapperRect.top;

            const scrollStep = 10;
            // 检查鼠标位置是否到达画布边缘
            if (mouseX < wrapperScrollLeft + 20) {
                // 到达左侧边缘
                this.$wrapper.scrollLeft = this.$wrapper.scrollLeft - scrollStep;
            } else if (mouseX > wrapperScrollLeft + wrapperRect.width - 20) {
                // 到达右侧边缘
                this.$wrapper.scrollLeft = this.$wrapper.scrollLeft + scrollStep;
            } else if (mouseY < wrapperScrollTop + 20) {
                // 到达上侧边缘
                this.$wrapper.scrollTop = this.$wrapper.scrollTop - scrollStep;
            } else if (mouseY > wrapperScrollTop + wrapperRect.height - 3) {
                // 到达下侧边缘
                this.$wrapper.scrollTop = this.$wrapper.scrollTop + scrollStep;
            } else {
            }
            return;
        }
        const { activeLine } = this.state.context;
        // @ts-ignore
        const isEditingLine = activeLine
            // @ts-ignore
            && [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(
                activeLine.type
            );
        const isDraggingCanvas = this.dragCanvasPo;
        if (!isDraggingCanvas) {
            this.$canvas.classList.remove(DRAG_CLASS);
        }
        if (!isEditingLine && !isDraggingCanvas) {
            return;
        }
        if (isDraggingCanvas) {
            this.dragCanvas(e.clientX, e.clientY);
        }
        if (isEditingLine && !this.props.readOnly) {
            this.editLine(e.clientX, e.clientY);
        }
    };

    samePostionLinesLength = (curLine: ITopologyLine): number => {
        const {
            data: { lines },
        } = this.props;
        return lines && lines.filter(item => item.start.split('-')[0] === curLine.start.split('-')[0] && item.end === curLine.end).length;
    }

    getLineRepeatIndex = (curLine): {
        index?: number;
    } => {
        const {
            startPointAnchorId,
        } = this.props;
        // 所有线条起始点与 startPointAnchorId 线条一致情况下，增加线条位置重复次数属性
        const index = startPointAnchorId !== undefined && this.samePostionLinesLength(curLine) ? { index: this.samePostionLinesLength(curLine) } : {};
        return index;
    }

    inSelection = (selectionPositionGroup: [IPosition, IPosition], nodePositionGroup: [IPosition, IPosition]) => {
        const [selectionLeftTopPosition, selectionRightBottomPosition] = selectionPositionGroup;
        const [nodeLeftTopPosition, nodeRightBottomPosition] = nodePositionGroup;
        return (
            nodeLeftTopPosition.x > selectionLeftTopPosition.x
            && nodeLeftTopPosition.y > selectionLeftTopPosition.y
            && nodeRightBottomPosition.x < selectionRightBottomPosition.x
            && nodeRightBottomPosition.y < selectionRightBottomPosition.y
        );
    }

    getBoxPositionGroup = () => {
        if (!this.state.boxSelectionInfo) {
            return undefined;
        }
        const {
            boxSelectionInfo: {
                initX,
                initY,
                x,
                y,
                initScrollTop,
                initScrollLeft,
                scrollTop,
                scrollLeft,
            },
            scaleNum,
        } = this.state;

        const scrollTopDistance = ((scrollTop - initScrollTop) || 0) / scaleNum;
        const scrollLeftDistance = ((scrollLeft - initScrollLeft) || 0) / scaleNum;

        const selectionLeftTopPosition = {
            x: Math.min(initX, x) - scrollLeftDistance,
            y: Math.min(initY, y) - scrollTopDistance,
        }
        const selectionRightBottomPosition = {
            x: Math.max(initX, x) + scrollLeftDistance,
            y: Math.max(initY, y) + scrollTopDistance,
        }
        return [selectionLeftTopPosition, selectionRightBottomPosition] as [IPosition, IPosition];
    }

    getNodeDomList = () => {
        return [...(this.$canvas.querySelectorAll('[id^="topology-node-"]') as any)] as Element[];
    }

    getCombineNode = (combineId: string) => {
        if (!combineId) {
            return [];
        }
        return this.props.data.nodes.filter(item => item.combineId === combineId);
    }

    // getShouldSelectedNodeList函数：获取框选中的节点列表
    getShouldSelectedNodeList = () => {
        // Step 1: 获取box(矩形选择框)的位置信息(boxPositionGroup)和需要筛选的DOM列表(nodeList)
        const boxPositionGroup = this.getBoxPositionGroup();
        const ret = {
            nativeNodeList: [] as Element[],
            selectedNodeList: [] as ITopologyNode[],
            boxPositionGroup,
        }

        // 如果没有筛选框的位置信息，则直接返回空；否则，获取框选中的节点列表进行下一步处理
        if (!boxPositionGroup) {
            return ret;
        }
        const nodeList: Element[] = this.getNodeDomList();

        // Step 2: 筛选出所有与box相交的节点(nativeNodeList)，以及属于这些节点所属的整合组合的集合(combineIdSet)
        const nativeNodeList = nodeList.filter(node => {
            const info = node.getBoundingClientRect();
            const nodePositionLeftTop: IPosition = {
                x: info.x,
                y: info.y,
            }
            const nodePositionRightBottom = {
                x: info.x + info.width,
                y: info.y + info.height,
            }
            const nodePositionGroup: [IPosition, IPosition] = [nodePositionLeftTop, nodePositionRightBottom];
            return this.inSelection(boxPositionGroup, nodePositionGroup);
        }) as HTMLElement [];
        const combineIdSet = new Set(nativeNodeList.map(node => node.dataset.combineId).filter(id => !!id)); // 把每个有'data-combine-id'属性的HTML节点转化为数组后，筛选出仅由combileId的(无重复)集合combineIdSet

        // Step 3: 将筛选后的结果flat化、去重和拼接之后，以id形式存储在shouldSelectedNodeIdList中
        const combineIdList = [];
        combineIdSet.forEach(id => {
            combineIdList.push(id);
        });
        const shouldSelectedNodeIdList = nativeNodeList.map(n => (n.firstChild as HTMLElement)).map(node => node.dataset.id); // 把所有HTML节点的第一个子元素，即头部节点的'data-id'属性放进shouldSelectedNodeIdList中
        this.props.data.nodes.forEach(node => { // 筛选出每个整合组合的'data-id', 拼接到shouldSelectedNodeIdList里面
            if (combineIdSet.has(node.combineId)) {
                shouldSelectedNodeIdList.push(node.id);
            }
        });

        // Step 4: 把结果与props.data.nodes中的节点进行比较并存储下来(selectedNodeList是把筛选过的节点的详细信息添加到一个新对象(IWidgetNode)构成的列表里)
        const idSet = new Set(shouldSelectedNodeIdList);

        const selectedNodeList: ITopologyNode[] = [];

        // 找到所有被选中的节点子节点
        this.props.data.nodes.forEach(node => {
            if (idSet.has(node.id) && isMatchKeyValue(node, 'dragChild', true)) {
                this.props.data.lines.forEach(line => {
                    if (line.start.split('-')[0] === node.id) {
                        idSet.add(line.end);
                    }
                })
            }
        })
        this.props.data.nodes.forEach(node => {
            if (idSet.has(node.id)) {
                selectedNodeList.push(node);
            }
        })

        // Step 5: 返回所有需要返回的信息(nativeNodeList, selectedNodeList, boxPositionGroup)，其中nativeNodeList中是从nodeList-filter-domNodeList里面经过box筛选后得到的HTML节点，selectedNodeList则是把选中节点详细存储到一个对象构成的列表里
        ret.nativeNodeList = nodeList.filter(node => idSet.has((node.firstChild as HTMLElement).dataset.id));
        ret.selectedNodeList = selectedNodeList;
        return ret;
    }


    couldDispatchContextMenuEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 2) {
            return false;
        }
        if (this.state.boxSelectionInfo && (Math.abs(this.state.boxSelectionInfo.initX - e.clientX) > 3 || Math.abs(this.state.boxSelectionInfo.initY - e.clientY) > 3)) {
            return false;
        }
        return true;
    }

    closeBoxSelection = () => {
        this.setState(this.state.boxSelectionInfo ? { boxVisibleFlag: true, boxSelectionInfo: null } : {boxSelectionInfo: null});
    }

    showBoxSelection = () => {
        if (this.state.boxVisibleFlag) {
            this.setState({
                boxVisibleFlag: false
            });
            this.generateBoxBySelectedNode();
        }
    }

    isEmitByNodeWrapper = (e) => {
        let target = e.target as HTMLElement;
        while(target?.className !== e?.currentTarget?.className && target !== document.body) {
            /** 在连线上鼠标右键，SVG的className属性返回的是一个SVGAnimatedString对象，不是字符串*/
            if (typeof(target.className) === 'string' && target.className.indexOf('topology-node-content') > -1) {
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }

    handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        const {
            data: { lines },
            readOnly
        } = this.props;
        const { clientX, clientY, screenX, screenY, button, buttons } = e;
        this.$canvas.classList.remove(DRAG_CLASS);
        const {
            boxSelectionInfo
        } = this.state;
        const shouldOpenContextMenuFlag = this.couldDispatchContextMenuEvent(e);
        const isMultiClick = e.ctrlKey || e.metaKey || e.shiftKey;
        const isDragBox = boxSelectionInfo && boxSelectionInfo.status === 'drag' && !shouldOpenContextMenuFlag;

        // 允许打开右键菜单
        if (shouldOpenContextMenuFlag && !this.isEmitByNodeWrapper(e)) {
            const mouseEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
                screenX,
                screenY,
                button,
                buttons
            });
            this.$wrapper.dispatchEvent(mouseEvent);
        }
        // 单击且没有按住ctrl/meta/shift键时，清空框选框
        if (!isMultiClick) {
            this.setState({
                boxSelectionInfo: undefined
            })
        }

        // 拖动框选box结束时
        if (isDragBox) {
            const { selectedNodeList: nodeList, nativeNodeList } = this.getShouldSelectedNodeList();
            if (nodeList.length === 0) { // 没有选中任何节点
                this.setState({
                    boxSelectionInfo: undefined
                });
                return;
            } else {
                this.generateBoxByRealSelectedNodeDom(nativeNodeList);
            }
            const lineList = getLinesFromNode(lines, nodeList);
            this.setContext({ selectedData: { nodes: nodeList, lines: lineList } }, () => {
                const { onSelect } = this.props;
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            });
            this.setState({
                boxSelectionInfo: {...this.state.boxSelectionInfo, status: 'none' as const}
            });
            return;
        }

        const { activeLine, impactNode } = this.state.context;
        const isLineEdit = activeLine && activeLine.type !== LineEditType.ADD;
        if (isLineEdit && impactNode && !readOnly) {
            const { type, origin } = activeLine!;
            if (type === LineEditType.EDIT_END) {
                const editLine = { start: origin.start, end: impactNode };
                const repeatIndex = this.getLineRepeatIndex(editLine) || {};
                const getNewline = (item: ITopologyLine) => {
                    if (!this.samePostionLinesLength(editLine)) {
                        // eslint-disable-next-line no-param-reassign
                        delete item.index;
                    }
                    return { ...item, end: impactNode, ...repeatIndex };
                };

                this.onChange(
                    {
                        ...this.props.data,
                        lines: lines.map(item => (_.isEqual(item, origin!)
                            ? getNewline(item)
                            : item))
                    },
                    ChangeType.EDIT_LINE
                );
            }
        }
        this.clearMouseEventData();
    };

    clearMouseEventData = () => {
        const { boxSelectionInfo } = this.state
        /**
         * 框选时鼠标如果移出容器不清除数据
         */
        if (boxSelectionInfo?.status === 'drag') {
            return
        }
        this.dragCanvasPo = null;
        this.setContext({ activeLine: null, linking: false, impactNode: null });
    };

    handleLineDraw = (startId: string) => {
        const { data, lineColor } = this.props;
        const { lines } = this.props.data;
        const {
            context: { impactNode }
        } = this.state;
        if (impactNode) {
            const newLine = { start: startId, end: impactNode };
            const alreadyExist = lines.find(item => _.isEqual(item, newLine));
            const anchor = startId.split("-")[1] || "";
            if (!alreadyExist) {
                const colorMap = lineColor ? { color: lineColor[anchor] } : {};
                const repeatIndex = this.getLineRepeatIndex(newLine) || {};
                this.onChange(
                    {
                        ...data,
                        lines: [
                            ...data.lines,
                            { ...newLine, ...colorMap, ...repeatIndex }
                        ]
                    },
                    ChangeType.ADD_LINE
                );
            }
        }
        this.clearMouseEventData();
    };

    /**
     * 遍历所有线条，生成[{ data: {origin, po}, point: [] }] 结构
     */
    getCurvePointsAndLineOriginMap = () => {
        const pathElements = document.querySelectorAll('svg.topology-svg path');
        // 创建一个空数组来存储匹配的路径点
        let linePointsMap = [];
        // 遍历路径标签，筛选出 stroke-width 属性为"20"的路径
        for (var i = 0; i < pathElements.length; i++) {
            var path = pathElements[i];
            if (path.getAttribute('stroke-width') === `${config.line.triggerWidth}`) {
                const dValue = path.getAttribute('d');
                // 获取贝塞尔曲线每个坐标点
                const coordinates = dValue.replace(/\n/g, '').match(/\d+(?:\.\d+)?/g);
                const formattedCoordinates = coordinates.map(coord => parseFloat(coord).toFixed(1));
                const result = formattedCoordinates.join(',');

                let dataJsonStr = path.getAttribute('data-json');
                if (typeof dataJsonStr !== "string" || !dataJsonStr) {
                    throw new Error("get line data-json error");
                }

                let pathPoint = {
                    data: JSON.parse(dataJsonStr),
                    point: [result]
                }
                linePointsMap.push(pathPoint);
            }
        }
        return linePointsMap;
    }

    /**
     * 拖动节点到边中间，自动连线
     * @param dragId 当前拖动的节点
     * @param targetPos 节点释放的位置
     * @returns
     */
    generateLinesByInsertNodeInLine = (dragId, targetPos) => {
        const { data, lineColor, allowNodeInsertOnEdge = false } = this.props;
        let insertLines = [];
        let cloneLines = [...data.lines];

        const linePointsMap = this.getCurvePointsAndLineOriginMap();
        const isolated = dragId && isolatedNode(data, dragId);
        // 拖动单个孤立节点，才会触发快捷插入逻辑
        if (allowNodeInsertOnEdge && isolated) {
            const nodeSize = getNodeSize(dragId);
            const minX = targetPos.x;
            const minY = targetPos.y;
            const maxX = targetPos.x + (nodeSize.width || 0);
            const maxY = targetPos.y + (nodeSize.height || 0);

            linePointsMap.forEach(line => {
                const points = line.point.join(',').split(',').map(val => Number(val));
                // 使用方法具体见：https://github.com/w8r/bezier-intersect#cubicbezieraabbax-ay-c1x-c1y-c2x-c2y-bx-by-minx-miny-maxx-maxy-resultarraynumbernumber
                let res = cubicBezierAABB(...points, minX, minY, maxX, maxY); // return 0 || 1
                if (res === 1) { // 相交
                    const currentLine = line.data.origin;
                    const sourceId = currentLine.start.split('-')?.[0];
                    const targetId = currentLine.end;
                    const colorMap = lineColor ? { color: lineColor[0] } : {};
                    // 删除当前 line：currentLine， 并添加两条新的 line: sourceId => dragId；dragId => targetId;
                    const upLine = { start: currentLine.start, end: dragId, ...colorMap };
                    const downLine = { start: `${dragId}-0`, end: targetId, ...colorMap };
                    cloneLines = _.differenceWith(data.lines, [currentLine], _.isEqual);
                    insertLines = [upLine, downLine];
                }
            })

        }

        return [...cloneLines, ...insertLines];
    }

    handleNodeDraw = (nodeInfoList: [string, IPosition][], childPosMap?: {
        [key: string]: {
            x: number;
            y: number;
        };
    }) => {
        const { data } = this.props;
        const posMaps = {
            ...nodeInfoList.reduce((prev, curr) => {
                const [nodeId, position] = curr;
                return {
                    ...prev,
                    [nodeId]: position
                }
            }, {}),
            ...childPosMap
        };
        const selectNodeIds = Object.keys(posMaps) || [];
        const dragId = selectNodeIds.length === 1 && selectNodeIds?.[0];

        const newLines = this.generateLinesByInsertNodeInLine(dragId, posMaps[dragId]);

        this.onChange(
            {
                ...data,
                // @ts-ignore
                nodes: data.nodes.map(item => (Object.keys(posMaps).includes(item.id) ? { ...item, position: posMaps[item.id] } : item)),
                lines: newLines,
            },
            ChangeType.LAYOUT
        );
    };

    handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const { boxSelectionInfo } = this.state;
        // @ts-ignore
        const { className } = e.target;
        if (
            typeof className === "string"
            && className.includes("topology-canvas")
        ) {
            // 当按住cmd或者ctrl的时候，左键点击背景图层的时候，不会清除选中的数据。
            if (e.ctrlKey || e.metaKey || !!boxSelectionInfo) {
                return;
            }
            this.clearSelectData();
        }
        this.setDraggingId(null);
    };

    renderNodes = () => {
        const {
            data: { nodes, lines },
            renderTreeNode,
            readOnly,
            isReduceRender,
            prevNodeStyle,
        } = this.props;
        const { context } = this.state;
        const selectedNodes = context.selectedData.nodes || [];
        const {
            scaleNum,
            draggingId,
        } = this.state;
        if (!renderTreeNode) {
            return null;
        }
        const lineHash = lines.reduce((pre, cur) => {
            const { start, end } = cur;
            const [parent] = start.split("-");
            return { ...pre, [parent]: true, [end]: true };
        }, {}) as { [id: string]: ITopologyLine };

        return nodes.map(item => (
            <NodeWrapper
                onMouseEnter={this.handleHoverCurrentNode}
                onMouseLeave={this.clearHoverCurrentNode}
                key={item.id}
                id={`${item.id}`}
                data={item}
                scaleNum={scaleNum}
                draggingId={draggingId}
                isSelected={this.isSelected(item.id)}
                combineId={item.combineId}
                getBoundary={this.getBoundary}
                selectedNodes={selectedNodes}
                setDraggingId={this.setDraggingId}
                isReduceRender={isReduceRender}
                closeBoxSelection={this.closeBoxSelection}
                readOnly={readOnly}
                prevNodeStyle={prevNodeStyle}
                isolated={!lineHash[item.id]}
                onSelect={this.selectNode}
            >
                {(wrapperOptions: IWrapperOptions) =>
                    /* eslint-disable */
                    renderTreeNode(item, wrapperOptions)
                }
            </NodeWrapper>
        ));
    };

    renderDomMap = (props: ITopologyProps = this.props) => {
        const {
            data: { nodes },
            renderTreeNode
        } = props;
        if (!renderTreeNode) {
            return;
        }
        let domMap = document.querySelector("#topology-dom-map");
        if (!domMap) {
            domMap = document.createElement("div");
            domMap.setAttribute("id", "topology-dom-map");
        }
        domMap.innerHTML = renderToStaticMarkup(
            <div>
                {nodes.map(item => (
                    <div
                        key={item.id}
                        id={`dom-map-${item.id}`}
                        className="dom-map-wrapper"
                    >
                        {renderTreeNode(item, {
                            anchorDecorator: ({ anchorId }) => (
                                _item: React.ReactNode
                            ) => (
                                <div
                                    id={`dom-map-${item.id}-${anchorId}`}
                                    key={anchorId}
                                    className="dom-map-wrapper"
                                >
                                    {_item}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        );
        document.body.appendChild(domMap);
        setTimeout(this.cacheNodeSize, 1000);
    };

    renderLines = () => {
        const {
            data: { lines, nodes },
            startPointAnchorId,
            anchorPlacement,
            lineTextMap,
            lineOffsetY,
            readOnly,
            lineTextColor,
            lineLinkageHighlight,
            lineTextDecorator,
            showText,
            isReduceRender
        } = this.props;
        const { activeLine, selectedData, hoverCurrentNode } = this.state.context;
        const nodeHash = createHashFromObjectArray(nodes, "id") as {
            [id: string]: ITopologyNode;
        };

        const isEditing = (line: ITopologyLine) =>
            activeLine &&
            activeLine.origin &&
            _.isEqual(line, activeLine.origin);
        const isSelected = (line: ITopologyLine) =>
            isEditing(line) || _.some(selectedData.lines, line);

        // @ts-ignore
        const isHighLight = (line: ITopologyLine) => {
            if (!hoverCurrentNode || !lineLinkageHighlight) return false;
            const { id } = hoverCurrentNode;
            if (line.start.split("-")[0] === id || line.end === id) return true;
        }

        const getLineStartPo = (line: ITopologyLine) => {
            if (
                isEditing(line) &&
                activeLine.type === LineEditType.EDIT_START
            ) {
                return activeLine.start;
            }

            if (anchorPlacement === 'bottom') {
                return computeAnchorPoWithNodeBottom(
                    `dom-map-${line.start}`,
                    nodeHash[line.start.split("-")[0]]
                );
            } else {
                // 这里特殊处理下，目的是保持所有锚点的起始点位置与 startPointAnchorId 锚点位置一致
                return computeAnchorPo(
                    `dom-map-${line.start}`,
                    // `dom-map-${startPointAnchorId === undefined ? line.start : `${line.start.split("-")[0]}-${startPointAnchorId}`}`,
                    nodeHash[line.start.split("-")[0]]
                );
            }


        };
        const getLineEndPo = (line: ITopologyLine) => {
            if (isEditing(line) && activeLine.type === LineEditType.EDIT_END) {
                return activeLine.end;
            }
            return computeNodeInputPo(nodeHash[line.end]);
        };

        return (
            <svg className="topology-svg">
                {lines.map((line, index) => {
                    const start = getLineStartPo(line);
                    const end = getLineEndPo(line);
                    if (!start || !end) {
                        return null;
                    }

                    const key = `${line.start}-${line.end}`;
                    const anchorId = line.start.split("-")[1];
                    const getTextXY = () => {
                        const minX = Math.min(start.x, end.x);
                        const minY = Math.min(start.y, end.y);
                        const x = minX + Math.abs((start.x - end.x) / 2);
                        const y = minY + Math.abs((start.y - end.y) / 2)
                        return {
                            x,
                            y
                        }
                    }

                    const defaultTextEl = lineTextColor && (
                        <text x={getTextXY().x} y={getTextXY().y} key={index} style={{
                            fill: lineTextColor[anchorId]
                        }}>{anchorId === startPointAnchorId && !showText(line.start.split("-")[0]) ? null : lineTextMap[anchorId]}</text>);

                    return (
                        <>
                            <Line
                                isReduceRender={isReduceRender}
                                scaleNum={this.state.scaleNum}
                                key={key}
                                lineOffsetY={lineOffsetY}
                                data={line}
                                start={start}
                                end={end}
                                onSelect={this.selectLine}
                                selected={isSelected(line)}
                                highLight={isHighLight(line)}
                                readOnly={readOnly}
                            />
                            {
                                lineTextDecorator ? <LineText data={this.props.data} lineTextDecorator={lineTextDecorator} position={getTextXY()} line={line} /> : defaultTextEl
                            }
                        </>

                    );
                })}
                {/* 拖动效果的线条 */}
                {activeLine && activeLine.type === LineEditType.ADD && (
                    <Line {...activeLine} scaleNum={this.state.scaleNum} />
                )}
            </svg>
        );
    };

    // TODO：系统计算设置一个合适的 scale，使所有节点均在可视化区域内
    findScale = async (clonegraph) => {
        const { scaleNum } = this.state;
        let downloadScale: number = Number(scaleNum && scaleNum.toFixed(1));

        let canvasEle = clonegraph.querySelector('#topology-canvas');
        canvasEle.style.transform = `scale(${downloadScale})`;
        const { minXId, maxXId, minYId, maxYId } = getMaxAndMinNodeId(this.props.data.nodes);
        let minYIdElement = clonegraph.querySelector(`#topology-node-${minYId}`);

        minYIdElement.scrollIntoView({ block: "start" });

        const isAllView = () => {
            let minxIdView = isInViewPort(minXId, document);
            let maxxIdView = isInViewPort(maxXId, document);
            let minYIdView = isInViewPort(minYId, document);
            let maxYIdView = isInViewPort(maxYId, document);
            return minxIdView && maxxIdView && minYIdView && maxYIdView
        }

        let isViw = isAllView();
        if (isViw) return downloadScale;

        // scale 从 1 => 0.1，寻找一个能完全展示所有内容的值
        for (let i = 1; i <= 10; i++) {
            downloadScale = Number((downloadScale - 0.1).toFixed(1));
            canvasEle.style.transform = `scale(${downloadScale})`;
            minYIdElement.scrollIntoView({ block: "start" });
            isViw = isAllView();
            if(isViw || downloadScale === 0.1) {
                break;
            }
        }
        return downloadScale;
    }

    /**
     * @param scopeType 下载区域类型（整个画布数据|选中的数据）
     * @param openDownload 是否开启下载
     * @param imgName 图片名称
     * @returns
     */
    downloadImg = async (scopeType?: 'global' | 'selected', openDownload?: boolean, imgName?: string) => {
        // openDownload && this.setState({ loading: true, })
        const {
            context: { selectedData },
            scaleNum
        } = this.state;

        const isGlobal = scopeType === 'global';
        const nodes = isGlobal ? this.props.data.nodes : selectedData && selectedData.nodes;

        const graphEl: HTMLDivElement = document.querySelector(".topology-canvas");
        let imgBase64 = '';

        const { minX, maxX, minY, maxY } = computeMaxAndMin(nodes)
        const imgPadding = isGlobal ? 50 : 0;
        const imgMinSize = 200;
        return html2canvas(graphEl, {
            onclone: function(documentClone){
                // 背景色置为透明色
                const nodeContentEls: HTMLCollectionOf<Element> = documentClone.getElementsByClassName('topology-node-content');
                nodeContentEls && Array.from(nodeContentEls).forEach((node: HTMLElement) => {
                    const childNode = node.childNodes && node.childNodes[0] as HTMLElement;
                    const grandsonChildNode = childNode && childNode.childNodes[0] as HTMLElement;
                    node.style.backgroundColor = 'transparent';
                    node.style.border = '1px solid #fff';
                    childNode.style.backgroundColor = 'white';
                    grandsonChildNode.style.boxShadow = 'none';
                    /**
                     * 处理文本域内的文字
                     * https://github.com/niklasvh/html2canvas/issues/2008#issuecomment-990597427
                     */
                    const textarea = grandsonChildNode.querySelector('textarea');
                    if (textarea) {
                        const text = textarea.value;
                        const div = documentClone.createElement('div')
                        div.innerText = text;
                        div.style.maxHeight = '285px';
                        div.style.overflow = 'hidden';
                        textarea.style.display = 'none'
                        textarea.parentElement.append(div)
                    }
                })
                const {  minYId } = getMaxAndMinNodeId(nodes);
                // 定位画布中最顶层的节点，让其滚动在浏览器顶部，尽可能的多展示其它节点
                let minYIdElement = documentClone.getElementById(`topology-node-${minYId}`);
                minYIdElement.scrollIntoView({
                    block: "start",
                    inline: 'center'
                });
            },
            backgroundColor: 'white',
            useCORS: true, //支持图片跨域
            scale: 1 / scaleNum,
            x: (minX - imgPadding) * scaleNum,
            y: (minY - imgPadding) * scaleNum,
            width: maxX - minX + imgMinSize,
            height: maxY - minY + imgMinSize,
        }).then((canvas) => {
            imgBase64 = canvas.toDataURL('image/png');
            // 生成图片导出
            if (openDownload) {
                const a = document.createElement('a');
                a.href = imgBase64;
                a.download = (imgName || '图片') + '.png';
                a.click();
            }
            this.setState({ loading: false })
            return Promise.resolve(imgBase64);
        })
    }

    /**
     * 整个画布截图
     */
    getImageBase64Url = async () => {
        const url = await this.downloadImg('global', false);
        return url;
    }

    /**
     * 选中数据截图
     */
    getImageBase64UrlWithSelectedData = async () => {
        const url = await this.downloadImg('selected', false);
        return url;
    }

    // 定位节点
    locateNodeById = (id) => {

        const { nodes } =  this.props.data;
        const curNode = nodes && nodes.find(n => n.id === id)
        const ele = document.getElementById(`topology-node-${id}`);
        if (ele) {
            // 如果已选中，则不做处理
            this.selectNode(curNode, SelectMode.SINGLE)
            ele.scrollIntoView({
                block: "center",
                inline: 'center'
            });
        }
    }

    renderToolBars = () => {
        const { scaleNum, loading } = this.state;
        const { showCenter, showLayout, showDownload, downloadImg, customToolboxList } = this.props;
        /* eslint-disable */
        // @ts-ignore
        const zoomPercent = `${parseInt(String((scaleNum ? scaleNum : 1).toFixed(1) * 100))}%`;

        const exportStyle: React.CSSProperties = loading ? {
            backgroundColor: 'rgba(0,0,0,.04)',
            cursor: 'not-allowed',
        } : {}

        return (
            <div className="topology-tools" data-html2canvas-ignore={false}>
                {showCenter !== false && <div
                    className="topology-tools-btn"
                    id="scroll-canvas-to-center"
                    onClick={this.props.customPostionHeight ? this.scrollCanvasToPositionY : this.scrollCanvasToCenter}
                >
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjY4NDk5IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjExMzciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNNTEzLjc5OTY0OSAyOTUuNzQyMjM4Yy0xMTguMTc2OTE5IDAtMjE0LjE1ODE3MiA5Ni4xODEyMTUtMjE0LjE1ODE3MyAyMTQuMTU4MTcyIDAgMTE4LjE3NjkxOSA5Ni4xODEyMTUgMjE0LjE1ODE3MiAyMTQuMTU4MTczIDIxNC4xNTgxNzIgMTE3Ljk3Njk1OCAwIDIxNC4xNTgxNzItOTUuNzgxMjkzIDIxNC4xNTgxNzItMjEzLjk1ODIxMXMtOTYuMTgxMjE1LTIxNC4zNTgxMzMtMjE0LjE1ODE3Mi0yMTQuMzU4MTMzeiBtMCAzNjcuMzI4MjU2Yy04NC4zODM1MTkgMC0xNTIuOTcwMTIzLTY4LjU4NjYwNC0xNTIuOTcwMTI0LTE1Mi45NzAxMjNzNjguNTg2NjA0LTE1Mi45NzAxMjMgMTUyLjk3MDEyNC0xNTIuOTcwMTIzIDE1Mi45NzAxMjMgNjguNTg2NjA0IDE1Mi45NzAxMjMgMTUyLjk3MDEyMy02OC41ODY2MDQgMTUyLjk3MDEyMy0xNTIuOTcwMTIzIDE1Mi45NzAxMjN6IiBmaWxsPSIjMzMzMzMzIiBwLWlkPSIxMTM4Ij48L3BhdGg+PHBhdGggZD0iTTk5MS4zMDYzODUgNDgwLjUwNjE1MUg5MTMuOTIxNWMtNy4xOTg1OTQtOTYuNTgxMTM2LTQ4LjE5MDU4OC0xODYuMzYzNjAxLTExNy4zNzcwNzUtMjU1LjU1MDA4OHMtMTU4Ljk2ODk1MS0xMTAuMTc4NDgxLTI1NS41NTAwODgtMTE3LjM3NzA3NVYzMC41OTQwMjVjMC0xNi43OTY3MTktMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1cy0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNCAzMC41OTQwMjV2NzYuOTg0OTYzYy05Ni4zODExNzYgNy4xOTg1OTQtMTg2LjM2MzYwMSA0OC4xOTA1ODgtMjU1LjU1MDA4OCAxMTcuMzc3MDc1UzExNC4wNzc3MTkgMzgzLjcyNTA1NCAxMDYuODc5MTI1IDQ4MC41MDYxNTFIMzAuNjk0MDA1Yy0xNi43OTY3MTkgMC0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNSAzMC41OTQwMjVzMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjUgMzAuNTk0MDI0aDc2LjE4NTEyYzcuMTk4NTk0IDk2LjU4MTEzNiA0OC4xOTA1ODggMTg2LjM2MzYwMSAxMTcuMzc3MDc1IDI1NS41NTAwODhzMTU4Ljk2ODk1MSAxMTAuMTc4NDgxIDI1NS41NTAwODggMTE3LjM3NzA3NXY3OC43ODQ2MTJjMCAxNi43OTY3MTkgMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjQgMzAuNTk0MDI1czMwLjU5NDAyNS0xMy43OTczMDUgMzAuNTk0MDI1LTMwLjU5NDAyNXYtNzguNzg0NjEyYzk2LjM4MTE3Ni03LjE5ODU5NCAxODYuMzYzNjAxLTQ4LjE5MDU4OCAyNTUuNTUwMDg4LTExNy4zNzcwNzVzMTEwLjE3ODQ4MS0xNTguOTY4OTUxIDExNy4zNzcwNzUtMjU1LjU1MDA4OGg3Ny4zODQ4ODVjMTYuNzk2NzE5IDAgMzAuNTk0MDI1LTEzLjc5NzMwNSAzMC41OTQwMjUtMzAuNTk0MDI0IDAtMTYuOTk2NjgtMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1ek03NTMuMTUyOSA3NTMuODUyNzYzYy02NC43ODczNDYgNjQuNzg3MzQ2LTE1MS4xNzA0NzUgMTAwLjU4MDM1NS0yNDIuNzUyNTg4IDEwMC41ODAzNTYtOTEuNzgyMDc0IDAtMTc3Ljk2NTI0MS0zNS43OTMwMDktMjQyLjc1MjU4Ny0xMDAuNTgwMzU2LTY0Ljc4NzM0Ni02NC43ODczNDYtMTAwLjU4MDM1NS0xNTEuMTcwNDc1LTEwMC41ODAzNTUtMjQyLjc1MjU4N3MzNS43OTMwMDktMTc3Ljk2NTI0MSAxMDAuNTgwMzU1LTI0Mi43NTI1ODhjNjQuNzg3MzQ2LTY0Ljc4NzM0NiAxNTEuMTcwNDc1LTEwMC41ODAzNTUgMjQyLjc1MjU4Ny0xMDAuNTgwMzU1IDkxLjc4MjA3NCAwIDE3Ny45NjUyNDEgMzUuNzkzMDA5IDI0Mi43NTI1ODggMTAwLjU4MDM1NSA2NC43ODczNDYgNjQuNzg3MzQ2IDEwMC41ODAzNTUgMTUxLjE3MDQ3NSAxMDAuNTgwMzU1IDI0Mi43NTI1ODhzLTM1LjU5MzA0OCAxNzcuOTY1MjQxLTEwMC41ODAzNTUgMjQyLjc1MjU4N3oiIGZpbGw9IiMzMzMzMzMiIHAtaWQ9IjExMzkiPjwvcGF0aD48L3N2Zz4="
                        alt=""
                    />
                    <div className="tooltip">定位中心</div>
                </div>}

                {showLayout !== false && <div
                    className="topology-tools-btn"
                    id="auto-layout"
                    onClick={() => this.autoLayout(this.props.autoLayoutOption)}
                >
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjU0MDc4IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwMjIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNODg1LjkyNzYxNyA2NzQuMzAwMTMyVjQ5Ny42NDYxMTNINTQwLjc3MTIyVjM1My44Mjk5MjRoMzQ1LjE1NzQyMVYxMjMuNjk3MDA2SDEzOC4wNzAzMzZ2MjMwLjEzMjkxOGgzNDUuMTU3NDIxdjE0My44MTYxODlIMTM4LjA3MDMzNnYxNzYuNjU0MDE5Yy00OS40Nzc3NzkgMTIuODYyOTMzLTg2LjI4ODA3NiA1Ny40OTc0MTQtODYuMjg4MDc2IDExMC45NTA3MjkgMCA2My40NTMwNDQgNTEuNTk4MDY1IDExNS4wNTIxMzMgMTE1LjA1NDE3OSAxMTUuMDUyMTMzIDYzLjQ1MjAyMSAwIDExNS4wNTAwODYtNTEuNTk5MDg5IDExNS4wNTAwODYtMTE1LjA1MjEzMyAwLTUzLjQ1MzMxNi0zNi44MTAyOTctOTguMDg3Nzk2LTg2LjI4ODA3Ni0xMTAuOTUwNzI5VjU1NS4xNDQ1NWgyODcuNjMwMzMxdjExOS4xNTQ1NTljLTQ5LjQ5MTA4MiAxMi44NjI5MzMtODYuMjg4MDc2IDU3LjQ5NzQxNC04Ni4yODgwNzYgMTEwLjk1MDcyOSAwIDYzLjQ1MzA0NCA1MS41OTkwODkgMTE1LjA1MjEzMyAxMTUuMDY2NDU5IDExNS4wNTIxMzMgNjMuNDI1NDE1IDAgMTE1LjA1NDE3OS01MS41OTkwODkgMTE1LjA1NDE3OS0xMTUuMDUyMTMzIDAtNTMuNDUzMzE2LTM2Ljc5ODAxNy05OC4wODc3OTYtODYuMjg5MDk5LTExMC45NTA3MjlWNTU1LjE0NDU1aDI4Ny42MzAzMzF2MTE5LjE1NDU1OWMtNDkuNDkzMTI5IDEyLjg2MjkzMy04Ni4yODcwNTMgNTcuNDk3NDE0LTg2LjI4NzA1MyAxMTAuOTUwNzI5IDAgNjMuNDUzMDQ0IDUxLjU2OTQxMyAxMTUuMDUyMTMzIDExNS4wNTExMSAxMTUuMDUyMTMzIDYzLjQyNDM5MSAwIDExNS4wNTMxNTYtNTEuNTk5MDg5IDExNS4wNTMxNTYtMTE1LjA1MjEzMy0wLjAwMjA0Ny01My40NTMzMTYtMzYuODAwMDY0LTk4LjA4Njc3My04Ni4yOTIxNy0xMTAuOTQ5NzA2ek0xOTUuNTk3NDI2IDE4MS4yMjQwOTZoNjMyLjgwNDEyNXYxMTUuMDUyMTMySDE5NS41OTc0MjZWMTgxLjIyNDA5NnogbTI4Ljc2NDA1NiA2MDQuMDI2NzY1YzAgMzEuNzEyMTk2LTI1LjgxNDg5NCA1Ny41NTQ3MTktNTcuNTI2MDY2IDU3LjU1NDcxOS0zMS43MTQyNDIgMC01Ny41MjcwOS0yNS44NDI1MjMtNTcuNTI3MDktNTcuNTU0NzE5IDAtMzEuNzE0MjQyIDI1LjgxMjg0Ny01Ny40OTg0MzcgNTcuNTI3MDktNTcuNDk4NDM3IDMxLjcxMjE5Ni0wLjAwMTAyMyA1Ny41MjYwNjYgMjUuNzgzMTcxIDU3LjUyNjA2NiA1Ny40OTg0Mzd6IG0zNDUuMTcxNzQ3IDBjMCAzMS43MTIxOTYtMjUuODQxNSA1Ny41NTQ3MTktNTcuNTI3MDg5IDU3LjU1NDcxOS0zMS43MjQ0NzUgMC01Ny41MzkzNjktMjUuODQyNTIzLTU3LjUzOTM2OS01Ny41NTQ3MTkgMC0zMS43MTQyNDIgMjUuODE1OTE3LTU3LjQ5ODQzNyA1Ny41MzkzNjktNTcuNDk4NDM3IDMxLjY4NTU5LTAuMDAxMDIzIDU3LjUyNzA5IDI1Ljc4MzE3MSA1Ny41MjcwODkgNTcuNDk4NDM3eiBtMjg3LjYzMTM1NSA1Ny41NTQ3MTljLTMxLjc0MTg3MiAwLTU3LjUyODExMy0yNS44NDI1MjMtNTcuNTI4MTEzLTU3LjU1NDcxOSAwLTMxLjcxNDI0MiAyNS43ODYyNDEtNTcuNDk4NDM3IDU3LjUyODExMy01Ny40OTg0MzcgMzEuNjg1NTkgMCA1Ny41MjcwOSAyNS43ODQxOTUgNTcuNTI3MDkgNTcuNDk4NDM3IDAgMzEuNzEyMTk2LTI1Ljg0MTUgNTcuNTU0NzE5LTU3LjUyNzA5IDU3LjU1NDcxOXoiIGZpbGw9IiMyYzJjMmMiIHAtaWQ9IjEwMjMiPjwvcGF0aD48L3N2Zz4="
                        alt=""
                    />
                    <div className="tooltip">自动布局</div>
                </div>}

                {showDownload && <div
                    className="topology-tools-btn"
                    id="export-img"
                    style={exportStyle}
                    onClick={async () => {
                        if (loading) return;
                        // 截图之前需要重置 scaleNum 为 1，避免坐标错位
                        this.setState({
                            scaleNum: 1,
                            loading: true,
                        }, () => {
                            downloadImg ? downloadImg() : this.downloadImg('global', true);
                        })

                    }}
                >
                    <img alt='' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiM2MTYxNjEiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxwYXRoIGQ9Ik01MTIgNjJsNS42LjRDNTM5LjggNjUuMSA1NTcgODQuMSA1NTcgMTA3YzAgMjQuOS0yMC4xIDQ1LTQ1IDQ1SDE3NC41bC00LjUuNWMtMTAuMyAyLjEtMTggMTEuMi0xOCAyMnY0OTcuOWwxNzIuOC0xNTguM2MyNy41LTI1LjIgNjguNy0yNy41IDk4LjYtNi4zbDUuOCA0LjUgMTUxLjkgMTMwLjIgMTA0LjQtMTA0LjNjMjYtMjYgNjYuMi0zMC4zIDk2LjktMTEuNGw2IDQuMSA4My41IDYyLjZWNTEyaDkwdjMzNy41bC0uMyA4LjRDOTU3LjQgOTE2LjEgOTA4LjggOTYyIDg0OS41IDk2MmgtNjc1bC04LjQtLjNDMTA3LjkgOTU3LjQgNjIgOTA4LjggNjIgODQ5LjV2LTY3NWwuMy04LjRDNjYuNiAxMDcuOSAxMTUuMiA2MiAxNzQuNSA2Mkg1MTJ6TTM3My4xIDU2MmwtMi43IDEuOUwxNTIgNzY0djg1LjVsLjUgNC41YzIuMSAxMC4zIDExLjIgMTggMjIgMThoNjc1YzEyLjQgMCAyMi41LTEwLjEgMjIuNS0yMi41VjY3Ny45bC0xMjQtOTNjLTMuNi0yLjctOC4zLTIuOS0xMi4xLS45bC0yLjYgMi0xMDAuNyAxMDAuNiA4MS40IDY5LjhjMTQuMiAxMi4xIDE1LjggMzMuNCAzLjcgNDcuNi0xMSAxMi45LTI5LjYgMTUuNC00My42IDYuNmwtNC0zLTI4NC43LTI0NGMtMy41LTMtOC4zLTMuNS0xMi4zLTEuNnpNOTE3IDQ2N2MyNC45IDAgNDUgMjAuMSA0NSA0NWgtOTBjMC0yNC45IDIwLjEtNDUgNDUtNDV6TTgwNC41IDczLjJjMTcuMSAwIDMxLjIgMTIuNyAzMy40IDI5LjJsLjMgNC42djE4OC41bDU0LjktNTQuOWMxMi0xMiAzMC43LTEzLjEgNDMuOS0zLjNsMy44IDMuM2MxMiAxMiAxMy4xIDMwLjcgMy4zIDQzLjlsLTMuMyAzLjgtMTEyLjQgMTEyLjYtMS44IDEuNi0uMy4yLS43LjctLjMuMi0uNS41LjQtLjQtMi42IDEuOWMtLjkuNi0xLjkgMS4xLTIuOSAxLjYtLjMuMS0uNi4zLS44LjQtMS4zLjYtMi42IDEuMS00IDEuNS0uNi4yLTEuMS4zLTEuNi41LTEuMS4zLTIuMy42LTMuNS43bC0uOS4xYy0xLjQuMi0yLjguMy00LjIuM2wtMi4zLS4xYy0yLjgtLjItNS42LS43LTguMi0xLjYtMS0uMy0xLjctLjYtMi4zLS45LTIuNS0xLTQuOS0yLjQtNy4yLTQuMS0uNy0uNS0xLjMtMS0xLjgtMS40bC0yLTEuOC0xMTIuOC0xMTIuNGMtMTMuMi0xMy4yLTEzLjItMzQuNSAwLTQ3LjcgMTItMTIgMzAuNy0xMy4xIDQzLjktMy4zbDMuOCAzLjMgNTQuOSA1NC45VjEwNy4xYy4xLTE4LjcgMTUuMi0zMy45IDMzLjgtMzMuOXoiLz48L3N2Zz4=' />
                    <div className="tooltip">{loading? '导出中...' : '导出图片'}</div>
                </div>}
                {Array.isArray(customToolboxList) &&
                    customToolboxList.map(({wrapperProps={}, content, tooltip}) => {
                        return (
                            <div
                                className="topology-tools-btn"
                                {...wrapperProps}

                            >
                                {content}
                                <div className="tooltip">{tooltip}</div>
                            </div>
                        );
                    })
                }
                <div className="topology-tools-zoom" onClick={this.zoomIn}>
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjIxOTIzNzE5OTI0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwOTIwIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PC9zdHlsZT48L2RlZnM+PHBhdGggZD0iTTUxMi42MTY5NDIgNjQuMTg2NjczYzYxLjcyMDU1MyAwIDExOS43OTA3ODIgMTEuNzc5ODEzIDE3NC4yMTEwODUgMzUuMzM5NDRzMTAxLjcwNjA0MyA1NS40MTU0MjggMTQxLjg1NzQyMSA5NS41Njc0MDVjNDAuMTUxMzc3IDQwLjE1MTk3NyA3Mi4wMDcxNzkgODcuMjcxODMgOTUuNTY3NDA1IDE0MS4zNTk3NTggMjMuNTYwMjI2IDU0LjA4NzcyOSAzNS4zNDAwMzkgMTExLjk5MjI2OSAzNS4zMzk0NCAxNzMuNzEzNDIyLTAuMDAwNiA2MS43MjA5NTMtMTEuNzgwMjEzIDExOS43OTEzODEtMzUuMzM5NDQgMTc0LjIxMTA4NS0yMy41NTkwMjcgNTQuNDE5NzAzLTU1LjQxNTAyOSAxMDEuNzA1NDQ0LTk1LjU2NzQwNSAxNDEuODU3NDIxLTQwLjE1MjU3NyA0MC4xNTE5NzctODcuNDM4MzE3IDcyLjAwNzc3OS0xNDEuODU3NDIxIDk1LjU2NzQwNS01NC40MTkxMDQgMjMuNTU5NjI3LTExMi40ODkzMzIgMzUuMzM5NDQtMTc0LjIxMTA4NSAzNS4zMzk0NHMtMTE5LjYyNjA5NC0xMS43Nzk4MTMtMTczLjcxMzQyMi0zNS4zMzk0NGMtNTQuMDg3MzI5LTIzLjU1OTYyNy0xMDEuMjA3MTgyLTU1LjQxNTQyOC0xNDEuMzU5NzU4LTk1LjU2NzQwNS00MC4xNTI1NzctNDAuMTUxOTc3LTcyLjAwODM3OC04Ny40Mzc3MTctOTUuNTY3NDA1LTE0MS44NTc0MjFzLTM1LjMzODg0LTExMi40ODk5MzItMzUuMzM5NDQtMTc0LjIxMTA4NWMtMC4wMDA2LTYxLjcyMTE1MyAxMS43NzkyMTQtMTE5LjYyNTQ5NCAzNS4zMzk0NC0xNzMuNzEzNDIyczU1LjQxNjAyOC0xMDEuMjA3NzgxIDk1LjU2NzQwNS0xNDEuMzU5NzU4IDg3LjI3MTIzLTcyLjAwNzc3OSAxNDEuMzU5NzU4LTk1LjU2NzQwNVM0NTAuODk2NTg4IDY0LjE4Njg3MyA1MTIuNjE2OTQyIDY0LjE4NjY3M3pNNzM0LjYxMDgzIDU3MC44OTEzMjhjMTkuOTA5NzAxIDAgMzcuODI4NTUyLTUuMTQzMzEzIDUzLjc1NjE1My0xNS40Mjk5MzkgMTUuOTI3NjAxLTEwLjI4NjYyNiAyMy44OTE0MDItMjUuNzE2NTY0IDIzLjg5MTQwMi00Ni4yODk4MTYgMC0xOS45MDk3MDEtNy45NjM4MDEtMzQuNjc2Mjg5LTIzLjg5MTQwMi00NC4yOTkzNjUtMTUuOTI3NjAxLTkuNjIzMDc2LTMzLjg0NjI1Mi0xNC40MzQ2MTMtNTMuNzU2MTUzLTE0LjQzNDgxM0wyOTQuNjA0MTU0IDQ1MC40MzczOTVjLTE5LjkwOTcwMSAwLTM4LjE2MDUyNyA0LjgxMTUzOC01NC43NTIyNzggMTQuNDM0ODEzLTE2LjU5MTc1MSA5LjYyMzA3Ni0yNC44ODc1MjYgMjQuMzg5NjY0LTI0Ljg4NzUyNiA0NC4yOTkzNjUgMCAyMC41NzMyNTEgOC4yOTU3NzUgMzYuMDAzMTkgMjQuODg3NTI2IDQ2LjI4OTgxNiAxNi41OTE3NTEgMTAuMjg2NjI2IDM0Ljg0MjM3NyAxNS40Mjk5MzkgNTQuNzUyMjc4IDE1LjQyOTkzOUw3MzQuNjEwODMgNTcwLjg5MTMyOCA3MzQuNjEwODMgNTcwLjg5MTMyOHoiIHAtaWQ9IjEwOTIxIiBmaWxsPSIjOUZBMkE4Ij48L3BhdGg+PC9zdmc+"
                        alt=""
                    />
                </div>

                <div className="topology-tools-percent">{zoomPercent}</div>
                <div className="topology-tools-zoom" onClick={this.zoomOut}>
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjIxOTIzNDA4MzQyIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjgwNSIgZGF0YS1zcG0tYW5jaG9yLWlkPSJhMzEzeC43NzgxMDY5LjAuaTIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNNTE3LjEyIDQzLjkxOTM2Yy0yNTguNzM0MDggMC00NjguNDggMjA5Ljc0NTkyLTQ2OC40OCA0NjguNDhzMjA5Ljc0NTkyIDQ2OC40OCA0NjguNDggNDY4LjQ4IDQ2OC40OC0yMDkuNzQ1OTIgNDY4LjQ4LTQ2OC40OC0yMDkuNzQ1OTItNDY4LjQ4LTQ2OC40OC00NjguNDh6TTc0Mi4yMzg3MiA1NjUuNzZINTcwLjg4djE3MS43OTkwNGMwIDI5LjU2OC0yNC4xOTIgNTMuNzYtNTMuNzYgNTMuNzZzLTUzLjc2LTI0LjE5Mi01My43Ni01My43NlY1NjUuNzZoLTE3MS40MzgwOGMtMjkuNTY4IDAtNTMuNzYtMjQuMTkyLTUzLjc2LTUzLjc2czI0LjE5Mi01My43NiA1My43Ni01My43Nkg0NjMuMzZ2LTE3MC45OTc3NmMwLTI5LjU2OCAyNC4xOTItNTMuNzYgNTMuNzYtNTMuNzZzNTMuNzYgMjQuMTkyIDUzLjc2IDUzLjc2VjQ1OC4yNGgxNzEuMzU4NzJjMjkuNTY4IDAgNTMuNzYgMjQuMTkyIDUzLjc2IDUzLjc2cy0yNC4xOTIgNTMuNzYtNTMuNzYgNTMuNzZ6IiBwLWlkPSI4MDYiIGZpbGw9IiM5RkEyQTgiPjwvcGF0aD48L3N2Zz4="
                        alt=""
                    />
                </div>
            </div>
        );
    };

    handleSelectAll = () => {
        const { data, onSelect } = this.props;
        this.setContext(
            {
                selectedData: data
            },
            () => {
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            }
        );
    };

    handleDeselectAll = () => {
        const { onSelect } = this.props;
        this.setContext(
            {
                selectedData: { nodes: [], lines: [] }
            },
            () => {
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            }
        );
    };

    /**
     * Check whether the drag node overlaps
     * @param nodeInfo [string, IPosition][]
     * @returns
     */
    validateIsOverlap = (nodeInfo: [string, IPosition][]): boolean => {
        const {
            data: { nodes },
            overlap,
            overlapOffset = {}
        } = this.props;

        if (!overlap) return false;
        const nodePosMap = new Map<string, IPosition>();
        nodeInfo.forEach(([id, pos]) => {
            nodePosMap.set(id, pos);
        });

        const getNodeOffsetPos = (position: IPosition, id: string): IPosition => {
            return {
                x: position.x + getNodeSize(id).width + overlapOffset.offsetX || 0,
                y: position.y + getNodeSize(id).height + overlapOffset.offsetY || 0,
            }
        }


        const posMap: IPosMap[] = nodes && nodes.filter(n => !nodePosMap.has(n.id) && !n.filterOverlap).map(n => {
            // const pos = nodePosMap.get(n.id);

            return {
                T1: {
                    x: n.position.x,
                    y: n.position.y,
                },
                T2: getNodeOffsetPos(n.position, n.id)
            }
        })
        const isOverlap = Array.from(nodePosMap).some(([id, pos]) => {
            const S1 = {
                x: pos.x,
                y: pos.y
            }
            const S2 = getNodeOffsetPos(pos, id);
            return posMap.some((p: IPosMap) => !(S2.y < p.T1.y || S1.y > p.T2.y || S2.x < p.T1.x || S1.x > p.T2.x) === true);
        });
        return isOverlap;
    }

    multiValidateIsOverlap = (drawId, pos): boolean => {
        return false;
    }

    setRealDragNodeDomList = (element?: Element[] | null) => {
        this.setState({
            realDragNodeDomList: element
        })
    }

    setAlignmentLines = (alignmentLines) => {
        this.setState({
            alignmentLines,
        })
    }

    // 获取 drag 时节点坐标
    getNodePosition = (monitor, nodeDom, isChild?) => {
        if (!monitor) return {};
        const { scaleNum } = this.state;
        const clientOffset = monitor.getDifferenceFromInitialOffset() || {};
        const nodePosition = {
            top: nodeDom.style.top,
            left: nodeDom.style.left
        };

        const scalePosition = {
            x:
                Number(nodePosition.left.replace(/[px]+/g, "")) +
                clientOffset.x / scaleNum || 0,
            y:
                Number(nodePosition.top.replace(/[px]+/g, "")) +
                clientOffset.y / scaleNum || 0
        };
        const scrollPosition = computeCanvasPo(
            monitor.getSourceClientOffset() || {},
            this.$wrapper
        )
        /**
         * TODO： scaleNum 缩放与窗口滚动时有冲突, isChild 为子节点联动时使用 scalePosition 定位
         */
        const position = scaleNum === 1 ? (
            isChild ? scalePosition : scrollPosition
        ) : scalePosition
        return position;
    }

    render() {
        const { connectDropTarget, showBar, showMinimap, snapline, renderMinimapChild } = this.props;
        const { context, scaleNum, boxSelectionInfo, alignmentLines } = this.state;
        const xPos = boxSelectionInfo ? `${boxSelectionInfo.x},${boxSelectionInfo.initX}` : '';
        const yPos = boxSelectionInfo ? `${boxSelectionInfo.y},${boxSelectionInfo.initY}` : '';

        // drag 框选操作时，窗口滚动的距离
        const scrollTopDistance = boxSelectionInfo?.status === 'drag' ? ((boxSelectionInfo?.scrollTop - boxSelectionInfo?.initScrollTop) || 0) / scaleNum : 0;
        const scrollLeftDistance = boxSelectionInfo?.status === 'drag' ? ((boxSelectionInfo?.scrollLeft - boxSelectionInfo?.initScrollLeft) || 0) / scaleNum : 0;

        const defaultChild = ({ node, ...props }) => {
            const id = node.getAttribute('id')?.split('-')?.[2];
            return (
                <div
                    onClick={() => { this.locateNodeById(id) }}
                    style={{
                        ...props,
                        position: "absolute",
                        backgroundColor: '#CCC',
                        border: '1px solid black',
                    }}
                />
            )
        }

        return connectDropTarget!(
            <div className="byai-topology"
                ref={r => {
                    this.$topology = r;
                }}
            >
                {/* 第一种：以可视化区域尺寸比例缩放，第二种：以原画布大小尺寸缩放 */}
                <Minimap
                    selector=".byai-topology-node-wrapper"
                    childComponent={renderMinimapChild ? renderMinimapChild : defaultChild}
                    visible={Boolean(showMinimap)}
                >
                    <div
                        ref={r => {
                            this.$wrapper = r;
                        }}
                        className={classnames({
                            "topology-wrapper": true,
                            "topology-linking": context.linking,
                        })}
                        onContextMenu={(e) => {
                            if (e.isTrusted) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }}
                        onMouseDown={this.handleMouseDown}
                        onMouseMove={this.handleMouseMove}
                        onMouseUp={this.handleMouseUp}
                        onMouseLeave={this.clearMouseEventData}
                    >
                        <div
                            ref={r => {
                                this.$canvas = r;
                            }}
                            id='topology-canvas'
                            className="topology-canvas topology-zoom"
                            // @ts-ignore
                            style={{
                                width: config.canvas.width,
                                height: config.canvas.height,
                                // @ts-ignore
                                "--scaleNum": scaleNum
                            }}
                            onClick={this.handleCanvasClick}
                        >
                            <Provider value={context}>
                                {this.renderNodes()}
                                {this.renderLines()}
                                <Selection
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.setState({
                                            boxSelectionInfo: null
                                        })
                                    }}
                                    ref={r => {
                                        this.boxSelectionRef = r;
                                    }}
                                    renderTool={typeof this.props.renderBoxSelectionTool === 'function' ? this.props.renderBoxSelectionTool : undefined}
                                    toolVisible={this.state.boxSelectionInfo && this.state.boxSelectionInfo.status === 'static'}
                                    xPos={xPos}
                                    yPos={yPos}
                                    scrollDistance={{
                                        scrollLeftDistance,
                                        scrollTopDistance,
                                    }}
                                    wrapper={this.$wrapper}
                                    visible={!!boxSelectionInfo}
                                />
                                {snapline !== false && <SnapLine alignmentLines={alignmentLines}/>}
                            </Provider>
                        </div>
                    </div>
                </Minimap>
                {showBar !== false && this.renderToolBars()}
            </div>
        );
    }
}

const hover = (props: ITopologyProps, monitor, component: Topology) => {
    if (!monitor.getItem()) {
        return;
    }

    const { context } = component.state;
    const clientOffset = monitor.getClientOffset();
    const { id } = monitor.getItem();
    const type = monitor.getItemType();
    switch (type) {
        case NodeTypes.ANCHOR:
            if (clientOffset) {
                const nodeId = id.split('-')[0];
                const parentNode = props.data.nodes.find(item => item.id === nodeId);
                const hasAnchorExistLine = !props.canConnectMultiLines && props.data.lines.find(item => item.start === id);
                if (hasAnchorExistLine || !parentNode || !component.$wrapper) { return; }

                const startPo = context.activeLine ? context.activeLine.start : computeAnchorPo(`dom-map-${id}`, parentNode);
                const endPo = computeCanvasPo(
                    clientOffset,
                    component.$wrapper
                );
                if (!startPo || !endPo) {
                    return;
                }
                const impactNode = component.impactCheck(endPo, startPo, id);
                component.setContext({
                    impactNode,
                    linking: true,
                    activeLine: {
                        type: LineEditType.ADD,
                        origin: null,
                        start: startPo,
                        end: endPo
                    }
                });
            }
            break;

        case NodeTypes.TEMPLATE_NODE:
        case NodeTypes.NORMAL_NODE: {
            const { nodes } = props.data;
            const nodeDom: HTMLElement = document.getElementById(`topology-node-${id}`);

            const ALIGNMENT_THRESHOLD = 2;

            // 计算两个节点之间的距离
            const getDistance = (node1, node2) => {
                const dx = Math.abs(node1.position.x - node2.position.x);
                const dy = Math.abs(node1.position.y - node2.position.y);
                return { dx, dy };
            };

            // 根据两个节点之间的距离信息，判断它们是否在水平或垂直方向上对齐
            const getAlignment = (node1, node2) => {
                const distance = getDistance(node1, node2);

                if (distance.dx < ALIGNMENT_THRESHOLD) {
                    return { vertical: true, x: node2.position.x };
                }

                if (distance.dy < ALIGNMENT_THRESHOLD) {
                    return { horizontal: true, y: node2.position.y };
                }

                return null;
            };

            const position = type === NodeTypes.TEMPLATE_NODE ? computeCanvasPo(
                    monitor.getSourceClientOffset(),
                    component.$wrapper
                ) : component.getNodePosition(monitor, nodeDom)
            const draggedNode = {
                id,
                position
            }

            // 计算所有节点之间的对齐关系，并更新对齐线的位置信息
            const newAlignmentLines = {};
            // 过滤掉当前拖动的节点
            nodes?.filter(n => n.id !== id)?.forEach((node) => {
                const alignment = getAlignment(draggedNode, node);
                if (alignment) {
                    // 过滤掉因为设置了 ALIGNMENT_THRESHOLD，而重复的辅助线
                    if (alignment.vertical && !Object.keys(newAlignmentLines).some(key => key.includes("line-vertical"))) {
                        // 垂直线
                        newAlignmentLines[`line-vertical-${node.id}`] = {
                            left: alignment.x,
                            top: 0,
                            height: "100%"
                        };
                    }

                    // 水平线
                    if (alignment.horizontal && !Object.keys(newAlignmentLines).some(key => key.includes("line-horizontal"))) {
                        newAlignmentLines[`line-horizontal-${node.id}`] = {
                            left: 0,
                            top: alignment.y,
                            width: "100%"
                        };
                    }
                }
            })
            // 选中多个节点
            const isSelectMultipleNode = context.selectedData.nodes.length > 1;

            if (!isSelectMultipleNode) {
                component.setAlignmentLines(newAlignmentLines)
            }

            component.setContext({
                dragging: true,
            });
            break;
        }

        default:
            break;
    }
}

const throttle350 = _.throttle(hover, 350)

const throttle40 = _.throttle(hover, 40)

export default DropTarget(
    [NodeTypes.NORMAL_NODE, NodeTypes.TEMPLATE_NODE, NodeTypes.ANCHOR],
    {
        canDrop(props: ITopologyProps) {
            return !props.readOnly;
        },
        hover: (props: ITopologyProps, monitor, component: Topology) => {
            const { nodes } = props.data;
            // 节点数量大于 200，降低刷新频率
            const update = nodes?.length >= 200 ? throttle350 : throttle40;
            return update?.(props, monitor, component);
        },
        drop(props: ITopologyProps, monitor, component: Topology) {
            if (monitor.didDrop() || !component.$wrapper) {
                return;
            }
            const item = monitor.getItem();
            const type = monitor.getItemType();
            const clientOffset = monitor.getDifferenceFromInitialOffset();
            if (!clientOffset) {
                return;
            }

            /**
             * Get the mapping relationship between the id and position of all child nodes of the current dragging node
             * @returns
             */
            const getChildPosMap = (idList: string[]) => {
                const { lines, nodes } = props.data;
                const curNodeList = nodes.filter(n => idList.indexOf(n.id) > -1);
                let childPosMap = {};
                curNodeList.forEach(curNode => {
                    const dragChild = curNode.dragChild || isMatchKeyValue(curNode, 'dragChild', true);
                    if (!dragChild) return null;
                    const childIds = lines.filter(n => n.start.split('-')[0] === curNode.id).map(n => n.end);
                    for (let childId of childIds) {
                        let childNodeDom: HTMLElement = document.getElementById(`topology-node-${childId}`);
                        if (!childNodeDom) return null;
                        childPosMap[childId] = component.getNodePosition(monitor, childNodeDom, true);
                    }
                })
                return childPosMap;
            }

            let position;
            let nodeDom: HTMLElement = document.getElementById(`topology-node-${item.id}`);
            if (nodeDom) {
                position = component.getNodePosition(monitor, nodeDom);
            } else {
                position = computeCanvasPo(
                    monitor.getSourceClientOffset(),
                    component.$wrapper
                )
            }
            let nodeProps: [string, IPosition][] = [[(item as ITopologyNode).id || item && item.data && item.data.id, position]];
            const isOverlap = (nodeInfo: [string, IPosition][]) => {
                return component.validateIsOverlap(nodeInfo);
            }

            switch (type) {
                case NodeTypes.TEMPLATE_NODE:
                    if (!item.data) {
                        return;
                    }
                    const isMultiInfo = item.data.nodes && Array.isArray(item.data.nodes) && item.data.lines && Array.isArray(item.data.lines);
                    /**
                     * TODO：Here first render the newly added node, if it overlaps, delete the node
                     * The main reason is that there is currently no good unified method to get the default width and height of the newly added nodes in the upper layer.
                     */
                    if (isMultiInfo) {
                        nodeProps = [];
                        const minX = Math.min(...item.data.nodes.map(n => n.position.x));
                        const minY = Math.min(...item.data.nodes.map(n => n.position.y));
                        const offset = {
                            x: position.x - minX,
                            y: position.y - minY
                        }
                        const selectedPositionList: [string, IPosition][] = [];
                        item.data.nodes.forEach(n => {
                            const newPosition = {
                                x: n.position.x + offset.x,
                                y: n.position.y + offset.y
                            }
                            selectedPositionList.push([n.id, newPosition]);
                        })
                        nodeProps = [...selectedPositionList, ...nodeProps];
                        const positionMap = new Map(nodeProps);
                        component.onChange({
                            ...props.data,
                            nodes: [...props.data.nodes, ...item.data.nodes.map(n => {
                                const newPosition = positionMap.get(n.id);
                                const p = newPosition ? newPosition : n.position;
                                return { ...n, position: p  }
                            })],
                            lines: [...props.data.lines, ...item.data.lines ]
                        }, ChangeType.ADD_NODE);
                    } else {
                        const dragInId = item.data?.id;
                        const newNodes = [...props.data.nodes, { ...item.data, position }];
                        // 优先设置 newNodes，目的是 generateLinesByInsertNodeInLine 函数中能够获取到当前拖入节点的 nodeSize
                        component.onChange({
                            ...props.data,
                            nodes: newNodes,
                        }, ChangeType.ADD_NODE);

                        const newLines = component.generateLinesByInsertNodeInLine(dragInId, position);
                        component.onChange({
                            ...props.data,
                            nodes: newNodes,
                            lines: newLines,
                        }, ChangeType.ADD_NODE);
                    }
                    if (isOverlap(nodeProps)) {
                        component.onChange({
                            ...props.data,
                            nodes: [...props.data.nodes],
                            lines: [...props.data.lines]
                        }, ChangeType.ADD_NODE);
                        props.overlapCallback && props.overlapCallback();
                    };
                    component.setAlignmentLines({});
                    component.setContext({
                        dragging: false,
                    });
                    break;
                case NodeTypes.NORMAL_NODE:
                    const targetNodeInfo = props.data.nodes.find(node => {
                        return node.id === item.id;
                    });
                    const targetPosition = targetNodeInfo ? targetNodeInfo.position : null;
                    if (targetPosition) {
                        const offset = {
                            x: position.x - targetPosition.x,
                            y: position.y - targetPosition.y
                        };
                        const selectedIdSet = new Set(component.state.context.selectedData.nodes.map(n => n.id));
                        const selectedPositionList: [string, IPosition][] = [];
                        props.data.nodes.forEach(n => {
                            if (selectedIdSet.has(n.id)) {
                                const newPosition = {
                                    x: n.position.x + offset.x,
                                    y: n.position.y + offset.y
                                }
                                selectedPositionList.push([n.id, newPosition]);
                            }
                        });
                        nodeProps = [...selectedPositionList, ...nodeProps]
                    }
                    if (isOverlap(nodeProps)) {
                        props.overlapCallback && props.overlapCallback();
                        component.showBoxSelection();
                        return;
                    };
                    component.handleNodeDraw(nodeProps, getChildPosMap(nodeProps.map(n => n[0])));
                    component.setAlignmentLines({});
                    component.setContext({
                        dragging: false,
                    });
                    // 存在移动动画时间
                    setTimeout(() => {
                        component.showBoxSelection();
                    }, 210);
                    break;
                case NodeTypes.ANCHOR:
                    component.handleLineDraw((item as { id: string }).id);
                    break;
                default:
                    break;
            }
        },
    },
    connect => ({ connectDropTarget: connect.dropTarget() }),
)(Topology);
