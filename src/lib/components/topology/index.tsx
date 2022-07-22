import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropTarget, ConnectDropTarget } from 'react-dnd';
import _ from 'lodash';
import classnames from 'classnames';
import selectNodes, { SelectMode } from '../../utils/selectNodes';
import { Provider, defaultContext } from '../context';
import NodeWrapper from '../node-wrapper';
import Line from '../line';
import LineText from '../line/lineText';
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
    computeMouseClientToCanvas,
    computeContentCenter,
    computeContentPostionY,
    createHashFromObjectArray,
    getNodeSize,
    shouldAutoLayout,
    isMatchKeyValue
} from '../../utils';
// import layoutCalculation from '../../utils/layoutCalculation';
import computeLayout from '../../utils/computeLayout';
import deleteSelectedData from '../../utils/deleteSelectedData';
import config from '../../config';
import './index.less';

export interface ITopologyProps {
    data: ITopologyData; // 数据 { nodes: []; lines: [] }
    readOnly?: boolean; // 只读模式，为true时不可编辑
    showBar?: boolean; // 是否显示工具栏
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
    lineTextMap?: {
        [x: string]: string; // 线条上文字与 anchorId 映射对象 eg: {'anchorId1': '锚点1', 'anchorId2': '锚点2'}
    };
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
}

interface ITopologyState {
    context: ITopologyContext;
    scaleNum: number;
    draggingId: string;
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

const initialTopologyState = {
    context: defaultContext,
    scaleNum: 1,
    draggingId: null
} as ITopologyState;

class Topology extends React.Component<ITopologyProps, ITopologyState> {
    $wrapper: HTMLDivElement | null;

    $canvas: HTMLDivElement | null;

    nodeSizeCache: NodeSizeCache = {};

    state: ITopologyState = initialTopologyState;

    dragCanvasPo: IPosition | null = null;

    shouldAutoLayout: boolean = false;

    constructor(props: ITopologyProps) {
        super(props);
        this.shouldAutoLayout = shouldAutoLayout(props.data.nodes);
    }

    componentWillMount() {
        this.renderDomMap();
    }

    componentDidMount() {
        const { getInstance, readOnly, customPostionHeight } = this.props;
        this.editLine = _.throttle(this.editLine, 40);
        if (!readOnly) {
            this.initDomEvents();
        }

        if (this.$wrapper) {
            // 自定义节点距离画布顶部高度
            if (customPostionHeight) {
                this.scrollCanvasToPositionY();
            } else {
                this.scrollCanvasToCenter();
            }
        }

        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout();
        }

        if (getInstance) {
            getInstance(this);
        }
    }

    componentWillReceiveProps(nextProps: ITopologyProps) {
        const { readOnly } = this.props;
        const { readOnly: nextReadOnly } = nextProps;
        this.renderDomMap(nextProps);
        this.shouldAutoLayout = shouldAutoLayout(nextProps.data.nodes);
        if (readOnly && !nextReadOnly) {
            this.initDomEvents();
        }
        if (!readOnly && nextReadOnly) {
            this.removeDomEvents();
        }
    }

    componentDidUpdate() {
        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout();
        }
    }

    componentWillUnmount() {
        // @ts-ignore
        if (typeof this.editLine.cancel === "function") {
            // @ts-ignore
            this.editLine.cancel();
        }

        this.removeDomEvents();
    }

    onChange = (data: ITopologyData, type: ChangeType) => {
        const { onChange } = this.props;
        if (!onChange) {
            return;
        }
        onChange(data, type);
    };

    scaleNum = 1;

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
            this.scaleNum = 1;
            return { scaleNum: 1 };
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

    clearSelectData = () => {
        this.setContext({ selectedData: { nodes: [], lines: [] } }, () => {
            const { onSelect } = this.props;
            if (onSelect) {
                onSelect(this.state.context.selectedData);
            }
        });
    }

    autoLayout = () => {
        const { data, sortChildren } = this.props;
        this.resetScale();
        this.onChange(
            {
                ...data,
                nodes: computeLayout(data, { sortChildren })
            },
            ChangeType.LAYOUT
        );
        this.clearSelectData(); // refresh
    };

    initDomEvents = () => {
        window.addEventListener("keydown", this.handleKeydown);
    };

    removeDomEvents = () => {
        window.removeEventListener("keydown", this.handleKeydown);
    };

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
        const { selectedData } = this.state.context;
        this.onChange(
            deleteSelectedData(data, selectedData),
            ChangeType.DELETE
        );
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
            return;
        }
        this.setContext(
            {
                selectedData: selectNodes({ data, selectedData })({
                    node,
                    mode
                })
            },
            () => {
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            }
        );
    };

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

        const clientPo = computeMouseClientToCanvas(
            clientX,
            clientY,
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

    clearHoverCurrentNode = () => {
        this.setContext({
            hoverCurrentNode: null
        });
    }

    handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement | SVGCircleElement>
    ) => {
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
        const { activeLine } = this.state.context;
        // @ts-ignore
        const isEditingLine = activeLine
            // @ts-ignore
            && [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(
                activeLine.type
            );
        const isDraggingCanvas = this.dragCanvasPo;
        if (!isEditingLine && !isDraggingCanvas) {
            return;
        }
        if (isDraggingCanvas) {
            this.dragCanvas(e.clientX, e.clientY);
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

    handleMouseUp = () => {
        const {
            data: { lines },
            readOnly
        } = this.props;
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

    handleNodeDraw = (nodeId: string, position: IPosition, childPosMap?: {
        [key: string]: {
            x: number;
            y: number;
        };
    }) => {
        const { data } = this.props;
        const posMaps = {
            [nodeId]: position,
            ...childPosMap
        };
        this.onChange(
            {
                ...data,
                // @ts-ignore
                nodes: data.nodes.map(item => (Object.keys(posMaps).includes(item.id) ? { ...item, position: posMaps[item.id] } : item))
            },
            ChangeType.LAYOUT
        );
    };

    handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // @ts-ignore
        const { className } = e.target;
        if (
            typeof className === "string"
            && className.includes("topology-canvas")
        ) {
            // 当按住cmd或者ctrl的时候，左键点击背景图层的时候，不会清楚选中的数据。
            if (e.ctrlKey || e.metaKey) {
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
                setDraggingId={this.setDraggingId}
                isReduceRender={isReduceRender}
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
            lineTextMap,
            lineOffsetY,
            readOnly,
            lineTextColor,
            lineLinkageHighlight,
            lineTextDecorator,
            showText
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

            // 这里特殊处理下，目的是保持所有锚点的起始点位置与 startPointAnchorId 锚点位置一致
            return computeAnchorPo(
                // `dom-map-${line.start}`,
                `dom-map-${startPointAnchorId === undefined ? line.start : `${line.start.split("-")[0]}-${startPointAnchorId}`}`,
                nodeHash[line.start.split("-")[0]]
            );
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

    renderToolBars = () => {
        const { scaleNum } = this.state;
        /* eslint-disable */
        // @ts-ignore
        const zoomPercent = `${parseInt(String(scaleNum.toFixed(1) * 100))}%`;
        return (
            <div className="topology-tools">
                <div
                    className="topology-tools-btn"
                    id="scroll-canvas-to-center"
                    onClick={this.props.customPostionHeight ? this.scrollCanvasToPositionY : this.scrollCanvasToCenter}
                >
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjY4NDk5IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjExMzciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNNTEzLjc5OTY0OSAyOTUuNzQyMjM4Yy0xMTguMTc2OTE5IDAtMjE0LjE1ODE3MiA5Ni4xODEyMTUtMjE0LjE1ODE3MyAyMTQuMTU4MTcyIDAgMTE4LjE3NjkxOSA5Ni4xODEyMTUgMjE0LjE1ODE3MiAyMTQuMTU4MTczIDIxNC4xNTgxNzIgMTE3Ljk3Njk1OCAwIDIxNC4xNTgxNzItOTUuNzgxMjkzIDIxNC4xNTgxNzItMjEzLjk1ODIxMXMtOTYuMTgxMjE1LTIxNC4zNTgxMzMtMjE0LjE1ODE3Mi0yMTQuMzU4MTMzeiBtMCAzNjcuMzI4MjU2Yy04NC4zODM1MTkgMC0xNTIuOTcwMTIzLTY4LjU4NjYwNC0xNTIuOTcwMTI0LTE1Mi45NzAxMjNzNjguNTg2NjA0LTE1Mi45NzAxMjMgMTUyLjk3MDEyNC0xNTIuOTcwMTIzIDE1Mi45NzAxMjMgNjguNTg2NjA0IDE1Mi45NzAxMjMgMTUyLjk3MDEyMy02OC41ODY2MDQgMTUyLjk3MDEyMy0xNTIuOTcwMTIzIDE1Mi45NzAxMjN6IiBmaWxsPSIjMzMzMzMzIiBwLWlkPSIxMTM4Ij48L3BhdGg+PHBhdGggZD0iTTk5MS4zMDYzODUgNDgwLjUwNjE1MUg5MTMuOTIxNWMtNy4xOTg1OTQtOTYuNTgxMTM2LTQ4LjE5MDU4OC0xODYuMzYzNjAxLTExNy4zNzcwNzUtMjU1LjU1MDA4OHMtMTU4Ljk2ODk1MS0xMTAuMTc4NDgxLTI1NS41NTAwODgtMTE3LjM3NzA3NVYzMC41OTQwMjVjMC0xNi43OTY3MTktMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1cy0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNCAzMC41OTQwMjV2NzYuOTg0OTYzYy05Ni4zODExNzYgNy4xOTg1OTQtMTg2LjM2MzYwMSA0OC4xOTA1ODgtMjU1LjU1MDA4OCAxMTcuMzc3MDc1UzExNC4wNzc3MTkgMzgzLjcyNTA1NCAxMDYuODc5MTI1IDQ4MC41MDYxNTFIMzAuNjk0MDA1Yy0xNi43OTY3MTkgMC0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNSAzMC41OTQwMjVzMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjUgMzAuNTk0MDI0aDc2LjE4NTEyYzcuMTk4NTk0IDk2LjU4MTEzNiA0OC4xOTA1ODggMTg2LjM2MzYwMSAxMTcuMzc3MDc1IDI1NS41NTAwODhzMTU4Ljk2ODk1MSAxMTAuMTc4NDgxIDI1NS41NTAwODggMTE3LjM3NzA3NXY3OC43ODQ2MTJjMCAxNi43OTY3MTkgMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjQgMzAuNTk0MDI1czMwLjU5NDAyNS0xMy43OTczMDUgMzAuNTk0MDI1LTMwLjU5NDAyNXYtNzguNzg0NjEyYzk2LjM4MTE3Ni03LjE5ODU5NCAxODYuMzYzNjAxLTQ4LjE5MDU4OCAyNTUuNTUwMDg4LTExNy4zNzcwNzVzMTEwLjE3ODQ4MS0xNTguOTY4OTUxIDExNy4zNzcwNzUtMjU1LjU1MDA4OGg3Ny4zODQ4ODVjMTYuNzk2NzE5IDAgMzAuNTk0MDI1LTEzLjc5NzMwNSAzMC41OTQwMjUtMzAuNTk0MDI0IDAtMTYuOTk2NjgtMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1ek03NTMuMTUyOSA3NTMuODUyNzYzYy02NC43ODczNDYgNjQuNzg3MzQ2LTE1MS4xNzA0NzUgMTAwLjU4MDM1NS0yNDIuNzUyNTg4IDEwMC41ODAzNTYtOTEuNzgyMDc0IDAtMTc3Ljk2NTI0MS0zNS43OTMwMDktMjQyLjc1MjU4Ny0xMDAuNTgwMzU2LTY0Ljc4NzM0Ni02NC43ODczNDYtMTAwLjU4MDM1NS0xNTEuMTcwNDc1LTEwMC41ODAzNTUtMjQyLjc1MjU4N3MzNS43OTMwMDktMTc3Ljk2NTI0MSAxMDAuNTgwMzU1LTI0Mi43NTI1ODhjNjQuNzg3MzQ2LTY0Ljc4NzM0NiAxNTEuMTcwNDc1LTEwMC41ODAzNTUgMjQyLjc1MjU4Ny0xMDAuNTgwMzU1IDkxLjc4MjA3NCAwIDE3Ny45NjUyNDEgMzUuNzkzMDA5IDI0Mi43NTI1ODggMTAwLjU4MDM1NSA2NC43ODczNDYgNjQuNzg3MzQ2IDEwMC41ODAzNTUgMTUxLjE3MDQ3NSAxMDAuNTgwMzU1IDI0Mi43NTI1ODhzLTM1LjU5MzA0OCAxNzcuOTY1MjQxLTEwMC41ODAzNTUgMjQyLjc1MjU4N3oiIGZpbGw9IiMzMzMzMzMiIHAtaWQ9IjExMzkiPjwvcGF0aD48L3N2Zz4="
                        alt=""
                    />
                    <div className="tooltip">定位中心</div>
                </div>
                <div
                    className="topology-tools-btn"
                    id="auto-layout"
                    onClick={this.autoLayout}
                >
                    <img
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjU0MDc4IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwMjIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNODg1LjkyNzYxNyA2NzQuMzAwMTMyVjQ5Ny42NDYxMTNINTQwLjc3MTIyVjM1My44Mjk5MjRoMzQ1LjE1NzQyMVYxMjMuNjk3MDA2SDEzOC4wNzAzMzZ2MjMwLjEzMjkxOGgzNDUuMTU3NDIxdjE0My44MTYxODlIMTM4LjA3MDMzNnYxNzYuNjU0MDE5Yy00OS40Nzc3NzkgMTIuODYyOTMzLTg2LjI4ODA3NiA1Ny40OTc0MTQtODYuMjg4MDc2IDExMC45NTA3MjkgMCA2My40NTMwNDQgNTEuNTk4MDY1IDExNS4wNTIxMzMgMTE1LjA1NDE3OSAxMTUuMDUyMTMzIDYzLjQ1MjAyMSAwIDExNS4wNTAwODYtNTEuNTk5MDg5IDExNS4wNTAwODYtMTE1LjA1MjEzMyAwLTUzLjQ1MzMxNi0zNi44MTAyOTctOTguMDg3Nzk2LTg2LjI4ODA3Ni0xMTAuOTUwNzI5VjU1NS4xNDQ1NWgyODcuNjMwMzMxdjExOS4xNTQ1NTljLTQ5LjQ5MTA4MiAxMi44NjI5MzMtODYuMjg4MDc2IDU3LjQ5NzQxNC04Ni4yODgwNzYgMTEwLjk1MDcyOSAwIDYzLjQ1MzA0NCA1MS41OTkwODkgMTE1LjA1MjEzMyAxMTUuMDY2NDU5IDExNS4wNTIxMzMgNjMuNDI1NDE1IDAgMTE1LjA1NDE3OS01MS41OTkwODkgMTE1LjA1NDE3OS0xMTUuMDUyMTMzIDAtNTMuNDUzMzE2LTM2Ljc5ODAxNy05OC4wODc3OTYtODYuMjg5MDk5LTExMC45NTA3MjlWNTU1LjE0NDU1aDI4Ny42MzAzMzF2MTE5LjE1NDU1OWMtNDkuNDkzMTI5IDEyLjg2MjkzMy04Ni4yODcwNTMgNTcuNDk3NDE0LTg2LjI4NzA1MyAxMTAuOTUwNzI5IDAgNjMuNDUzMDQ0IDUxLjU2OTQxMyAxMTUuMDUyMTMzIDExNS4wNTExMSAxMTUuMDUyMTMzIDYzLjQyNDM5MSAwIDExNS4wNTMxNTYtNTEuNTk5MDg5IDExNS4wNTMxNTYtMTE1LjA1MjEzMy0wLjAwMjA0Ny01My40NTMzMTYtMzYuODAwMDY0LTk4LjA4Njc3My04Ni4yOTIxNy0xMTAuOTQ5NzA2ek0xOTUuNTk3NDI2IDE4MS4yMjQwOTZoNjMyLjgwNDEyNXYxMTUuMDUyMTMySDE5NS41OTc0MjZWMTgxLjIyNDA5NnogbTI4Ljc2NDA1NiA2MDQuMDI2NzY1YzAgMzEuNzEyMTk2LTI1LjgxNDg5NCA1Ny41NTQ3MTktNTcuNTI2MDY2IDU3LjU1NDcxOS0zMS43MTQyNDIgMC01Ny41MjcwOS0yNS44NDI1MjMtNTcuNTI3MDktNTcuNTU0NzE5IDAtMzEuNzE0MjQyIDI1LjgxMjg0Ny01Ny40OTg0MzcgNTcuNTI3MDktNTcuNDk4NDM3IDMxLjcxMjE5Ni0wLjAwMTAyMyA1Ny41MjYwNjYgMjUuNzgzMTcxIDU3LjUyNjA2NiA1Ny40OTg0Mzd6IG0zNDUuMTcxNzQ3IDBjMCAzMS43MTIxOTYtMjUuODQxNSA1Ny41NTQ3MTktNTcuNTI3MDg5IDU3LjU1NDcxOS0zMS43MjQ0NzUgMC01Ny41MzkzNjktMjUuODQyNTIzLTU3LjUzOTM2OS01Ny41NTQ3MTkgMC0zMS43MTQyNDIgMjUuODE1OTE3LTU3LjQ5ODQzNyA1Ny41MzkzNjktNTcuNDk4NDM3IDMxLjY4NTU5LTAuMDAxMDIzIDU3LjUyNzA5IDI1Ljc4MzE3MSA1Ny41MjcwODkgNTcuNDk4NDM3eiBtMjg3LjYzMTM1NSA1Ny41NTQ3MTljLTMxLjc0MTg3MiAwLTU3LjUyODExMy0yNS44NDI1MjMtNTcuNTI4MTEzLTU3LjU1NDcxOSAwLTMxLjcxNDI0MiAyNS43ODYyNDEtNTcuNDk4NDM3IDU3LjUyODExMy01Ny40OTg0MzcgMzEuNjg1NTkgMCA1Ny41MjcwOSAyNS43ODQxOTUgNTcuNTI3MDkgNTcuNDk4NDM3IDAgMzEuNzEyMTk2LTI1Ljg0MTUgNTcuNTU0NzE5LTU3LjUyNzA5IDU3LjU1NDcxOXoiIGZpbGw9IiMyYzJjMmMiIHAtaWQ9IjEwMjMiPjwvcGF0aD48L3N2Zz4="
                        alt=""
                    />
                    <div className="tooltip">自动布局</div>
                </div>

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
     * @param drawId
     * @param pos
     * @returns
     */
    validateIsOverlap = (drawId, pos): boolean => {
        const {
            data: { nodes },
            overlap,
            overlapOffset = {}
        } = this.props;

        if (!overlap) return false;

        const getNodeOffsetPos = (position: IPosition, id: string): IPosition => {
            return {
                x: position.x + getNodeSize(id).width + overlapOffset.offsetX || 0,
                y: position.y + getNodeSize(id).height + overlapOffset.offsetY || 0,
            }
        }

        const S1 = {
            x: pos.x,
            y: pos.y
        }
        const S2 = getNodeOffsetPos(pos, drawId);
        const posMap: IPosMap[] = nodes && nodes.filter(n => n.id !== drawId && !n.filterOverlap).map(n => {
            return {
                T1: {
                    x: n.position.x,
                    y: n.position.y,
                },
                T2: getNodeOffsetPos(n.position, n.id)
            }
        })
        const isOverlap = posMap.some((p: IPosMap) => !(S2.y < p.T1.y || S1.y > p.T2.y || S2.x < p.T1.x || S1.x > p.T2.x) === true);
        return isOverlap;
    }

    render() {
        const { connectDropTarget, showBar } = this.props;
        const { context, scaleNum } = this.state;
        return connectDropTarget!(
            <div className="byai-topology">
                <div
                    ref={r => {
                        this.$wrapper = r;
                    }}
                    className={classnames({
                        "topology-wrapper": true,
                        "topology-linking": context.linking
                    })}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                    onMouseLeave={this.clearMouseEventData}
                >
                    <div
                        ref={r => {
                            this.$canvas = r;
                        }}
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
                        </Provider>
                    </div>
                </div>
                {showBar !== false && this.renderToolBars()}
            </div>
        );
    }
}

function hover(props: ITopologyProps, monitor, component: Topology) {
    if (!monitor.getItem()) {
        return;
    }
    const { context } = component.state;
    const clientOffset = monitor.getClientOffset();
    const { id, type } = monitor.getItem();
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
        default:
            break;
    }
}


export default DropTarget(
    [NodeTypes.NORMAL_NODE, NodeTypes.TEMPLATE_NODE, NodeTypes.ANCHOR],
    {
        canDrop(props: ITopologyProps) {
            return !props.readOnly;
        },
        hover: _.throttle(hover, 40),
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

            const getNodePosition = (nodeDom, isChild?) => {
                const nodePosition = {
                    top: nodeDom.style.top,
                    left: nodeDom.style.left
                };
                const scalePosition = {
                    x:
                        Number(nodePosition.left.replace(/[px]+/g, "")) +
                        clientOffset.x / component.scaleNum,
                    y:
                        Number(nodePosition.top.replace(/[px]+/g, "")) +
                        clientOffset.y / component.scaleNum
                };

                const scrollPosition = computeCanvasPo(
                    monitor.getSourceClientOffset(),
                    component.$wrapper
                )
                /**
                 * TODO： scaleNum 缩放与窗口滚动时有冲突, isChild 为子节点联动时使用 scalePosition 定位
                 */
                const position = component.scaleNum === 1 ? (
                    isChild ? scalePosition : scrollPosition
                ) : scalePosition
                return position;
            }

            /**
             * Get the mapping relationship between the id and position of all child nodes of the current dragging node
             * @returns
             */
            const getChildPosMap = () => {
                const { lines, nodes } = props.data;
                const curNode = nodes.find(n => n.id === item.id);
                const dragChild = curNode.dragChild || isMatchKeyValue(curNode, 'dragChild', true);
                // // TODO: 测试下 isMatchKeyValue 性能
                // const dragChild = curNode.dragChild || curNode && curNode.extra && curNode.extra.dragChild;
                if (!dragChild) return null;
                const childIds = lines.filter(n => n.start.split('-')[0] === item.id).map(n => n.end);
                let childPosMap = {};
                for (let childId of childIds) {
                    let childNodeDom: HTMLElement = document.getElementById(`topology-node-${childId}`);
                    if (!childNodeDom) return null;
                    childPosMap[childId] = getNodePosition(childNodeDom, true);
                }
                return childPosMap;
            }

            let position;
            let nodeDom: HTMLElement = document.getElementById(`topology-node-${item.id}`);
            if (nodeDom) {
                position = getNodePosition(nodeDom);
            } else {
                position = computeCanvasPo(
                    monitor.getSourceClientOffset(),
                    component.$wrapper
                )
            }

            const isOverlap = (id, position) => {
                return component.validateIsOverlap(id, position);
            }

            switch (type) {
                case NodeTypes.TEMPLATE_NODE:
                    if (!item.data) {
                        return;
                    }
                    /**
                     * TODO：Here first render the newly added node, if it overlaps, delete the node
                     * The main reason is that there is currently no good unified method to get the default width and height of the newly added nodes in the upper layer.
                     */
                    component.onChange({
                        ...props.data,
                        nodes: [...props.data.nodes, { ...item.data, position }],
                    }, ChangeType.ADD_NODE);

                    if (isOverlap(item.data.id, position)) {
                        component.onChange({
                            ...props.data,
                            nodes: [...props.data.nodes],
                        }, ChangeType.ADD_NODE);
                        props.overlapCallback && props.overlapCallback();
                    };
                    break;
                case NodeTypes.NORMAL_NODE:
                    if (isOverlap((item as ITopologyNode).id, position)) {
                        props.overlapCallback && props.overlapCallback();
                        return;
                    };
                    component.handleNodeDraw((item as ITopologyNode).id, position, getChildPosMap());
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
