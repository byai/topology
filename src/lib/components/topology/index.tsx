import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropTarget, ConnectDropTarget } from 'react-dnd';
import _ from 'lodash';
import classnames from 'classnames';
import selectNodes, { SelectMode } from '../../utils/selectNodes';
import { Provider, defaultContext } from '../context';
import NodeWrapper from '../node-wrapper';
import Line from '../line';
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
    createHashFromObjectArray,
    getNodeSize,
    shouldAutoLayout,
} from '../../utils';
// import layoutCalculation from '../../utils/layoutCalculation';
import computeLayout from '../../utils/computeLayout';
import deleteSelectedData from '../../utils/deleteSelectedData';
import config from '../../config';
import './index.less';

interface ITopologyProps {
    data: ITopologyData;
    readOnly?: boolean;
    autoLayout?: boolean;
    onChange?: (data: ITopologyData, type: ChangeType) => void;
    onSelect?: (data: ITopologyData) => void;
    getInstance?: (instance: Topology) => void;
    renderTreeNode?: (data: ITopologyNode, wrappers: IWrapperOptions) => React.ReactNode;
    sortChildren?: (parent: ITopologyNode, children: ITopologyNode[]) => ITopologyNode[];
    connectDropTarget?: ConnectDropTarget;
}

interface ITopologyState {
    context: ITopologyContext;
    scaleNum: number;
}

interface NodeSizeCache {
    [id: string]: { width: number; height: number };
}

const initialTopologyState = {
    context: defaultContext,
    scaleNum: 1,
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
        const { getInstance, readOnly } = this.props;
        this.editLine = _.throttle(this.editLine, 40);
        if (!readOnly) {
            this.initDomEvents();
        }

        if (this.$wrapper) {
            this.scrollCanvasToCenter();
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
        if (typeof this.editLine.cancel === 'function') {
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
    }

    zoomIn = () => {
        this.setState((prevState: ITopologyState) => ({ scaleNum: prevState.scaleNum > 0.2 ? prevState.scaleNum - 0.1 : 0.1 }));
    }

    zoomOut = () => {
        this.setState((prevState: ITopologyState) => ({ scaleNum: prevState.scaleNum < 2 ? prevState.scaleNum + 0.1 : 2 }));
    }

    scrollCanvasToCenter = () => {
        if (!this.$wrapper || !this.$canvas) {
            return;
        }
        const canvasSize = getNodeSize(this.$canvas);
        const wrapperSize = getNodeSize(this.$wrapper);
        const contentCenter = computeContentCenter(this.props.data.nodes);
        const canvasCenter = {
            x: canvasSize.width / 2,
            y: canvasSize.height / 2,
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
    }

    cacheNodeSize = () => {
        const { data: { nodes } } = this.props;
        // 已节点id为键值，缓存节点的宽和高，避免碰撞检测时频繁操作DOM
        this.nodeSizeCache = nodes.reduce(
            (pre: NodeSizeCache, cur: ITopologyNode) => ({ ...pre, [cur.id]: getNodeSize(cur.id) }),
            {},
        );
    }

    impactCheck = (endPo: IPosition, startPo: IPosition) => {
        const { data: { nodes } } = this.props;
        const impactNode = nodes.find((item) => {
            if (!this.nodeSizeCache[item.id]) {
                this.nodeSizeCache[item.id] = getNodeSize(item.id);
            }
            return this.nodeSizeCache[item.id] && impactCheck(endPo, this.nodeSizeCache[item.id], item.position as IPosition);
        });
        // 起点和终点是同一节点
        if (impactNode && impactCheck(startPo, this.nodeSizeCache[impactNode.id], impactNode.position as IPosition)) {
            return null;
        }
        return impactNode ? impactNode.id : null;
    }

    autoLayout = () => {
        const { data, sortChildren } = this.props;
        this.onChange({
            ...data,
            nodes: computeLayout(data, { sortChildren }),
        }, ChangeType.LAYOUT);
    }

    initDomEvents = () => {
        window.addEventListener('keydown', this.handleKeydown);
    }

    removeDomEvents = () => {
        window.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown = (e: KeyboardEvent) => {
        // eslint-disable-next-line
        const { classList = [] } = e.target as any;
        // 左侧的搜索输入框回删事件不触发话术更改
        if (classList[0] === 'ant-input') {
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
    }

    deleteItem = () => {
        const { data } = this.props;
        const { selectedData } = this.state.context;
        this.onChange(
            deleteSelectedData(data, selectedData),
            ChangeType.DELETE,
        );
    }

    setContext = (values: ValuesOf<ITopologyContext>, callback?: Function) => {
        const { context } = this.state;
        this.setState({ context: { ...context, ...values } }, () => {
            if (callback) {
                callback();
            }
        });
    }

    selectNode = (node: ITopologyNode, mode: SelectMode) => {
        const { data, onSelect } = this.props;
        const { context: { selectedData } } = this.state;
        const selectNodesId = selectedData.nodes.map(item => item.id);
        if (mode === SelectMode.RIGHT_NORMAL && selectNodesId.indexOf(node.id) !== -1) {
            onSelect(selectedData);
            return;
        }
        this.setContext({
            selectedData: selectNodes({ data, selectedData })({ node, mode }),
        }, () => {
            if (onSelect) {
                onSelect(this.state.context.selectedData);
            }
        });
    }

    selectLine = (data: ITopologyData) => {
        this.setContext({
            selectedData: data,
        }, () => {
            const { onSelect } = this.props;
            if (onSelect) {
                onSelect(this.state.context.selectedData);
            }
        });
    }

    dragCanvas = (clientX: number, clientY: number) => {
        if (!this.$wrapper) {
            return;
        }
        const dX = this.dragCanvasPo!.x - clientX;
        const dY = this.dragCanvasPo!.y - clientY;
        this.dragCanvasPo = { x: clientX, y: clientY };
        this.$wrapper.scrollTop = this.$wrapper.scrollTop + dY;
        this.$wrapper.scrollLeft = this.$wrapper.scrollLeft + dX;
    }

    editLine = (clientX: number, clientY: number) => {
        const { activeLine } = this.state.context;
        if (!this.$wrapper || !activeLine) {
            return;
        }

        const clientPo = computeMouseClientToCanvas(clientX, clientY, this.$wrapper);
        const impactNode = this.impactCheck(
            clientPo,
            activeLine![activeLine.type === LineEditType.EDIT_START ? 'end' : 'start'],
        );

        this.setContext({
            impactNode,
            activeLine: {
                ...activeLine,
                [activeLine.type]: clientPo,
            },
        });
    }

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement | SVGCircleElement>) => {
        // @ts-ignore
        const itemType = e.target.getAttribute('data-type');
        // @ts-ignore
        const { className } = e.target;
        const getClickType = () => {
            // @ts-ignore
            if ([LineEditType.EDIT_START, LineEditType.EDIT_END].includes(itemType || '')) {
                return 'CLICK_LINE_POINT';
            } else if (typeof className === 'string' && className.includes('topology-canvas')) {
                return 'CLICK_CANVAS';
            }
            return '';
        };
        switch (getClickType()) {
            case 'CLICK_CANVAS':
                this.dragCanvasPo = { x: e.clientX, y: e.clientY };
                break;
            case 'CLICK_LINE_POINT':
                if (this.props.readOnly) {
                    break;
                }
                try {
                    // @ts-ignore
                    const jsonStr = e.target.getAttribute('data-json');
                    if (typeof jsonStr !== 'string' || !jsonStr) {
                        throw (new Error('线段起点无数据'));
                    }
                    const { origin, po } = JSON.parse(jsonStr);
                    this.setContext({
                        linking: true,
                        activeLine: {
                            origin,
                            start: po.start,
                            end: po.end,
                            type: itemType,
                        },
                    });
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.log(err);
                }
                break;
            default:
                break;
        }
    }

    handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { activeLine } = this.state.context;
        // @ts-ignore
        const isEditingLine = activeLine && [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(activeLine.type);
        const isDraggingCanvas = this.dragCanvasPo;
        if (!isEditingLine && !isDraggingCanvas) {
            return;
        }
        if (isDraggingCanvas) {
            this.dragCanvas(e.clientX, e.clientY);
        }
        if (isEditingLine && !this.props.readOnly) {
            this.editLine(e.clientX, e.clientY);
        }
    }

    handleMouseUp = () => {
        const { data: { lines }, readOnly } = this.props;
        const { activeLine, impactNode } = this.state.context;
        const isLineEdit = activeLine && activeLine.type !== LineEditType.ADD;
        if (isLineEdit && impactNode && !readOnly) {
            const { type, origin } = activeLine!;
            if (type === LineEditType.EDIT_END) {
                this.onChange({
                    ...this.props.data,
                    lines: lines.map(item => (
                        _.isEqual(item, origin!) ? { ...item, end: impactNode } : item
                    )),
                }, ChangeType.EDIT_LINE);
            }
        }
        this.clearMouseEventData();
    }

    clearMouseEventData = () => {
        this.dragCanvasPo = null;
        this.setContext({ activeLine: null, linking: false, impactNode: null });
    }

    handleLineDraw = (startId: string) => {
        const { data } = this.props;
        const { lines } = this.props.data;
        const { context: { impactNode } } = this.state;
        if (impactNode) {
            const newLine = { start: startId, end: impactNode };
            const alreadyExist = lines.find(item => _.isEqual(item, newLine));

            if (!alreadyExist) {
                this.onChange({ ...data, lines: [...data.lines, newLine] }, ChangeType.ADD_LINE);
            }
        }
        this.clearMouseEventData();
    }

    handleNodeDraw = (nodeId: string, position: IPosition) => {
        const { data } = this.props;
        this.onChange({
            ...data,
            nodes: data.nodes.map(item => (item.id === nodeId ? { ...item, position } : item)),
        }, ChangeType.LAYOUT);
    }

    handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // @ts-ignore
        const { className } = e.target;
        if (typeof className === 'string' && className.includes('topology-canvas')) {
            // 当按住cmd或者ctrl的时候，左键点击背景图层的时候，不会清楚选中的数据。
            if (e.ctrlKey || e.metaKey) {
                return;
            }
            this.setContext({ selectedData: { nodes: [], lines: [] } }, () => {
                const { onSelect } = this.props;
                if (onSelect) {
                    onSelect(this.state.context.selectedData);
                }
            });
        }
    }

    renderNodes = () => {
        const { data: { nodes, lines }, renderTreeNode, readOnly } = this.props;
        if (!renderTreeNode) {
            return null;
        }
        const lineHash = lines.reduce((pre, cur) => {
            const { start, end } = cur;
            const [parent] = start.split('-');
            return { ...pre, [parent]: true, [end]: true };
        }, {}) as { [id: string]: ITopologyLine };

        return nodes.map(item => (
            <NodeWrapper
                key={item.id}
                id={`${item.id}`}
                data={item}
                readOnly={readOnly}
                isolated={!lineHash[item.id]}
                onSelect={this.selectNode}
            >
                {(wrapperOptions: IWrapperOptions) => renderTreeNode(item, wrapperOptions)}
            </NodeWrapper>
        ));
    }

    renderDomMap = (props: ITopologyProps = this.props) => {
        const { data: { nodes }, renderTreeNode } = props;
        if (!renderTreeNode) {
            return;
        }
        let domMap = document.querySelector('#topology-dom-map');
        if (!domMap) {
            domMap = document.createElement('div');
            domMap.setAttribute('id', 'topology-dom-map');
        }
        domMap.innerHTML = renderToStaticMarkup((
            <div>
                {nodes.map(item => (
                    <div key={item.id} id={`dom-map-${item.id}`} className="dom-map-wrapper">
                        {renderTreeNode(item, {
                            anchorDecorator: ({ anchorId }) => (_item: React.ReactNode) => (
                                <div
                                    id={`dom-map-${item.id}-${anchorId}`}
                                    key={anchorId}
                                    className="dom-map-wrapper"
                                >
                                    {_item}
                                </div>
                            ),
                        })}
                    </div>
                ))}
            </div>
        ));
        document.body.appendChild(domMap);
        setTimeout(this.cacheNodeSize, 1000);
    }

    renderLines = () => {
        const { data: { lines, nodes } } = this.props;
        const {
            activeLine,
            selectedData,
        } = this.state.context;
        const nodeHash = createHashFromObjectArray(nodes, 'id') as { [id: string]: ITopologyNode };

        const isEditing = (line: ITopologyLine) => (
            activeLine && activeLine.origin && _.isEqual(line, activeLine.origin)
        );
        const isSelected = (line: ITopologyLine) => (
            isEditing(line) || _.some(selectedData.lines, line)
        );
        const getLineStartPo = (line: ITopologyLine) => {
            if (isEditing(line) && activeLine.type === LineEditType.EDIT_START) {
                return activeLine.start;
            }
            return computeAnchorPo(`dom-map-${line.start}`, nodeHash[line.start.split('-')[0]]);
        };
        const getLineEndPo = (line: ITopologyLine) => {
            if (isEditing(line) && activeLine.type === LineEditType.EDIT_END) {
                return activeLine.end;
            }
            return computeNodeInputPo(nodeHash[line.end]);
        };

        return (
            <svg className="topology-svg">
                {lines.map((line) => {
                    const start = getLineStartPo(line);
                    const end = getLineEndPo(line);
                    if (!start || !end) { return null; }
                    return (
                        <Line
                            key={`${line.start}-${line.end}`}
                            data={line}
                            start={start}
                            end={end}
                            onSelect={this.selectLine}
                            selected={isSelected(line)}
                            readOnly={this.props.readOnly}
                        />
                    );
                })}
                {activeLine && activeLine.type === LineEditType.ADD && (
                    <Line {...activeLine} />
                )}
            </svg>
        );
    }

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
                    onClick={this.scrollCanvasToCenter}
                >
                    <img src="https://cdn.byai.com/static/topology/center.svg" alt="" />
                    <div className="tooltip">定位中心</div>
                </div>
                <div
                    className="topology-tools-btn"
                    id="auto-layout"
                    onClick={this.autoLayout}
                >
                    <img src="https://cdn.byai.com/static/topology/layout.svg" alt="" />
                    <div className="tooltip">自动布局</div>
                </div>

                <div className='topology-tools-zoom' onClick={this.zoomIn}>
                    <img src="https://cdn.byai.com/static/oss-script/86e0beab7ddc653b754613005ed8b40a.svg" alt="" />
                </div>

                <div className='topology-tools-percent'>{zoomPercent}</div>
                <div className='topology-tools-zoom' onClick={this.zoomOut}>
                    <img src="https://cdn.byai.com/static/oss-script/f1419d479a9b370a540017cee64de7e7.svg" alt="" />
                </div>
            </div>
        )
    }

    render() {
        const { connectDropTarget } = this.props;
        const { context, scaleNum } = this.state;
        return connectDropTarget!((
            <div className="byai-topology">
                <div
                    ref={(r) => { this.$wrapper = r; }}
                    className={classnames({
                        'topology-wrapper': true,
                        'topology-linking': context.linking,
                    })}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                    onMouseLeave={this.clearMouseEventData}
                >
                    <div
                        ref={(r) => { this.$canvas = r; }}
                        className="topology-canvas topology-zoom"
                        // @ts-ignore
                        style={{ width: config.canvas.width, height: config.canvas.height, '--scaleNum': scaleNum }}
                        onClick={this.handleCanvasClick}
                    >
                        <Provider value={context}>
                            {this.renderNodes()}
                            {this.renderLines()}
                        </Provider>
                    </div>
                </div>
                {this.renderToolBars()}
            </div>
        ));
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
                const hasExist = props.data.lines.find(item => item.start === id);

                if (hasExist || !parentNode || !component.$wrapper) { return; }

                const startPo = context.activeLine ? context.activeLine.start : computeAnchorPo(`dom-map-${id}`, parentNode);
                const endPo = computeCanvasPo(clientOffset, component.$wrapper);
                if (!startPo || !endPo) { return; }

                const impactNode = component.impactCheck(endPo, startPo);
                component.setContext({
                    impactNode,
                    linking: true,
                    activeLine: {
                        type: LineEditType.ADD,
                        origin: null,
                        start: startPo,
                        end: endPo,
                    },
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
            const clientOffset = monitor.getSourceClientOffset();
            if (!clientOffset) {
                return;
            }
            const position = computeCanvasPo(clientOffset, component.$wrapper);
            switch (type) {
                case NodeTypes.TEMPLATE_NODE:
                    if (!item.data) {
                        return;
                    }
                    component.onChange({
                        ...props.data,
                        nodes: [...props.data.nodes, { ...item.data, position }],
                    }, ChangeType.ADD_NODE);
                    break;
                case NodeTypes.NORMAL_NODE:
                    component.handleNodeDraw((item as ITopologyNode).id, position);
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
