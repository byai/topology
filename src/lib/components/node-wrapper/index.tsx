import React from 'react';
import { DragSource, DragElementWrapper } from 'react-dnd';
import classnames from 'classnames';
import AnchorWrapper from '../anchor-wrapper';
import { Consumer } from '../context';
import {
    NodeTypes,
    ITopologyContext,
    ITopologyNode,
    IWrapperOptions,
} from '../../declare';
import './index.less';
import { SelectMode } from '../../utils/selectNodes';
import {
    getRealNodeDom,
    isMatchKeyValue
} from '../../utils';
import config from '../../config';

// @ts-ignore
export interface INodeWrapperProps {
    id?: string;
    data?: ITopologyNode;
    scaleNum?: number;
    draggingId?: string;
    context?: ITopologyContext;
    setDraggingId?: (id: string) => void;
    onSelect: (node: ITopologyNode, mode: SelectMode) => ITopologyNode;
    children: (wrapperOptions: IWrapperOptions) => React.ReactNode;
    onMouseEnter?: (node: ITopologyNode) => void;
    onMouseLeave?: () => void;
    readOnly?: boolean;
    isReduceRender?: boolean;
    isSelected?: boolean;
    getBoundary: (elements: Element[]) => {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    closeBoxSelection: () => void;
    showBoxSelection?: () => void;
    selectedNodes?: ITopologyNode[];
    combineId?: string;
    prevNodeStyle?: {
        // 暂时支持这两个属性
        border?: string;
        background?: string;
    };
    canDrag?: boolean;
    filterOverlap?: boolean;
    /** 是否孤立节点 */
    isolated?: boolean;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
}

class NodeWrapper extends React.Component<INodeWrapperProps> {
    /** 锚点自增id */
    private increaseAnchorId = 0;

    private updateNumber = 0;

    shouldComponentUpdate(nextprops) {
        const { data: nextData, context: { selectedData: nextSelectedData, impactNode: nextImpactNode }, isReduceRender } = nextprops;
        const { data, context: { selectedData, impactNode } } = this.props;

        if (impactNode && impactNode === nextImpactNode) {
            this.updateNumber += 1;
        } else {
            this.updateNumber = 0;
        }
        // 避免节点多次无用渲染
        if (isReduceRender && !impactNode && nextData === data && nextSelectedData === selectedData) {
            return false;
        }
        if (this.updateNumber >= 2) {
            return false;
        }

        return true;
    }

    computeStyle = () => {
        const { data, isolated } = this.props;
        if (!data) {
            return undefined;
        }
        data.position = data.position || { x: 0, y: 0 };
        return {
            position: 'absolute',
            left: data.position.x,
            top: data.position.y,
            transition: config.transition,
            zIndex: isolated ? 999 : undefined,
        } as React.CSSProperties;
    };

    anchorDecorator = (options: { anchorId?: string }) => {
        const { id, readOnly } = this.props;
        const anchorId = options.anchorId || (this.increaseAnchorId += 1);
        return (item: React.ReactNode) => (
            <AnchorWrapper
                key={`${id}-${anchorId}`}
                id={`${id}-${anchorId}`}
                readOnly={readOnly}
            >
                {item}
            </AnchorWrapper>
        );
    };

    impactCheck = () => {
        const { context, data, id } = this.props;
        const { activeLine, impactNode } = context as ITopologyContext;
        if (!activeLine || !data || !id) {
            return false;
        }
        return id === impactNode;
    };

    handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // 避免一些交互上的冲突,改为mousedown触发
        const { data, onSelect, closeBoxSelection } = this.props;
        closeBoxSelection?.();

        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            onSelect(data, SelectMode.MULTI);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            onSelect(data, SelectMode.MUL_NORMAL);
            return;
        }
        if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
            onSelect(data, SelectMode.BOX_SELECTION);
            return;
        }
        onSelect(data, SelectMode.NORMAL);
    };

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const { data, onSelect, closeBoxSelection } = this.props;

        if (e.button === 2) {
            closeBoxSelection?.();
            e.preventDefault();
            onSelect(data, SelectMode.RIGHT_NORMAL);
        }
        // const { data, onSelect, closeBoxSelection } = this.props;
        // closeBoxSelection();
        // if (e.button === 2) {
        //     e.preventDefault();
        //     onSelect(data, SelectMode.RIGHT_NORMAL);
        //     return;
        // }
        // if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        //     onSelect(data, SelectMode.MULTI);
        //     return;
        // }
        // if (e.ctrlKey || e.metaKey) {
        //     onSelect(data, SelectMode.MUL_NORMAL);
        //     return;
        // }
        // if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
        //     onSelect(data, SelectMode.BOX_SELECTION);
        //     return;
        // }
        // if (!isSelect) {
        //     onSelect(data, SelectMode.NORMAL);
        // }
    };

    handleRightClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
    };

    /**
     * set preview Dom width height style
     */
    /* eslint-disable */
    getPreviewNodeStyle = () => {
        const { data, scaleNum, id, draggingId } = this.props;
        const realNodeDom = document.getElementById(`topology-node-${data && data.id}`);
        if (!realNodeDom) return null
        const previewNodeWidth = scaleNum * realNodeDom.offsetWidth - 2; // border
        const previewNodeHeight = scaleNum * realNodeDom.offsetHeight - 2;
        let previewStyle = {};
        // 放大模式下拖动中 previewNode 样式处理
        if (scaleNum > 1 && draggingId === id) {
            const draggingPreviewNode: HTMLElement = document.querySelector(`div[data-id='${draggingId}']`);
            if (!draggingPreviewNode) return null;
            setTimeout(() => {
                draggingPreviewNode.style.background = 'transparent';
                draggingPreviewNode.style.border = 'none';
            }, 0);
        }
        // 连线触发节点或者放大时对未拖动中 previewNode 样式处理
        if(this.impactCheck() || (scaleNum > 1 && draggingId !== id)) {
            previewStyle = {
                background: 'transparent',
                border: 'none'
            }
        }
        return {
            width: previewNodeWidth,
            height: previewNodeHeight,
            ...previewStyle
        };
    };


    render() {
        const {
            connectDragSource,
            connectDragPreview,
            children,
            data,
            context,
            id,
            onMouseEnter,
            onMouseLeave
        } = this.props;

        const { selectedData, activeLine } = context;
        const isSelected =
            selectedData.nodes.find(item => item.id === data.id) !== undefined;
        return connectDragSource(
            <div
                id={data ? `topology-node-${data.id}` : ""}
                data-combine-id={data?.combineId}
                style={this.computeStyle()}
                className="byai-topology-node-wrapper"
                onClick={this.handleClick}
                onContextMenu={this.handleRightClick}
                onMouseDown={(e) => {
                    // @ts-ignore
                    this.handleMouseDown(e, isSelected);
                }}
                onMouseEnter={() => { onMouseEnter(data) }}
                onMouseLeave={() => { onMouseLeave() }}>
                {connectDragPreview(
                    <div
                        data-id={`${id}`}
                        style={this.getPreviewNodeStyle()}
                        className="topology-node-preview"
                    />
                )}
                <div
                    className={classnames({
                        "topology-node-content": true,
                        "topology-node-selected": isSelected,
                        "topology-node-impact": activeLine && this.impactCheck()
                    })}
                >
                    {children({ anchorDecorator: this.anchorDecorator })}
                </div>
            </div>
        );
    }
}

const WithContextNodeWrapper = (props: INodeWrapperProps) => (
    <Consumer>
        {context => <NodeWrapper {...props} context={context} />}
    </Consumer>
);

export default DragSource(
    NodeTypes.NORMAL_NODE,
    {
        canDrag(props: INodeWrapperProps) {
            const canDragNode = props.canDrag === false || isMatchKeyValue(props, 'canDrag', false);
            return canDragNode ? !canDragNode : (props.readOnly ? !props.readOnly: !canDragNode);
        },
        beginDrag(props: INodeWrapperProps) {
            const id = props.data ? props.data.id : null;
            const { prevNodeStyle = {}, closeBoxSelection } = props;
            closeBoxSelection?.();
            props.setDraggingId(id);
            // beginDrag 时机 处理预览节点样式问题
            const draggingPreviewNode: HTMLElement = document.querySelector(`div[data-id='${id}']`);
            if (!draggingPreviewNode) return null;
            const realNodeDom = getRealNodeDom(id);
            if (!realNodeDom) return null;
            let distanceX = 0;
            let distanceY = 0;
            let source: ITopologyNode;
            if (!props.isSelected) {
                source = props.onSelect(props.data, SelectMode.NORMAL);
            }
            const otherRealNodeDomList = (source ? source.nodes: props.selectedNodes).filter(item => item.id !== id).map(item => getRealNodeDom(item.id));
            const allRealNodeDomList = [...otherRealNodeDomList, realNodeDom];
            let width = realNodeDom.offsetWidth;
            let height = realNodeDom.offsetHeight
            if (otherRealNodeDomList.length > 0) {
                const boxPosition = props.getBoundary(allRealNodeDomList);
                const { x , y } = realNodeDom.getBoundingClientRect();
                distanceX = x - boxPosition.minX;
                distanceY = y - boxPosition.minY;
                width = boxPosition.maxX - boxPosition.minX;
                height = boxPosition.maxY - boxPosition.minY;
            }
            const previewNodeWidth =  width - 2; // border
            const previewNodeHeight = height - 2;
            draggingPreviewNode.style.background = prevNodeStyle.background || '#6f6fc7';
            draggingPreviewNode.style.border = prevNodeStyle.border || '1px dashed #1F8CEC';
            draggingPreviewNode.style.setProperty('--width', previewNodeWidth + 'px');
            draggingPreviewNode.style.setProperty('--height', previewNodeHeight + 'px');
            draggingPreviewNode.style.setProperty('--transformX', `${-distanceX}px`);
            draggingPreviewNode.style.setProperty('--transformY', `${-distanceY}px`);
            // 恢复
            setTimeout(() => {
                draggingPreviewNode.style.background = 'transparent';
                draggingPreviewNode.style.border = 'none';
            }, 0);
            return { id };
        },
        endDrag(props: INodeWrapperProps) {
            props.setDraggingId(null);
            const id = props.data ? props.data.id : null;
            props.showBoxSelection && props.showBoxSelection();
            const draggingPreviewNode: HTMLElement = document.querySelector(`div[data-id='${id}']`);
            if (!draggingPreviewNode) return null;
            draggingPreviewNode.style.setProperty('--width', '100%');
            draggingPreviewNode.style.setProperty('--height', '100%');
            draggingPreviewNode.style.setProperty('--transformX', '0px');
            draggingPreviewNode.style.setProperty('--transformY', '0px');
        },
    },
    connect => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    }),
)(WithContextNodeWrapper);
