import React from 'react';
import { DragSource, DragElementWrapper } from 'react-dnd';
import classnames from 'classnames';
import { JsxElement } from 'typescript';
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
// import {
//     isMatchKeyValue
// } from '../../utils';
import config from '../../config';

// @ts-ignore
export interface INodeWrapperProps {
    id?: string;
    data?: ITopologyNode;
    scaleNum?: number;
    draggingId?: string;
    context?: ITopologyContext;
    setDraggingId?: (id: string) => void;
    onSelect: (node: ITopologyNode, mode: SelectMode) => void;
    children: (wrapperOptions: IWrapperOptions) => React.ReactNode;
    onMouseEnter?: (node: ITopologyNode) => void;
    onMouseLeave?: () => void;
    readOnly?: boolean;
    isReduceRender?: boolean;
    canDrag?: boolean;
    filterOverlap?: boolean;
    /** 是否孤立节点 */
    isolated?: boolean;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
}

class NodeWrapper extends React.Component<INodeWrapperProps> {
    /** 锚点自增id */
    private increaseAnchorId: number = 0;

    shouldComponentUpdate(nextprops) {
        const { data: nextData, context: { selectedData: nextSelectedData }, isReduceRender } = nextprops;
        const { data, context: { selectedData, impactNode } } = this.props;

        if (isReduceRender && !impactNode && nextData === data && nextSelectedData === selectedData) {
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
        return (item: JsxElement) => (
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
        const { onSelect, data } = this.props;
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            onSelect(data, SelectMode.MULTI);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            onSelect(data, SelectMode.MUL_NORMAL);
            return;
        }
        onSelect(data, SelectMode.NORMAL);
    };

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.button === 2) {
            e.preventDefault();
            const { data, onSelect } = this.props;
            onSelect(data, SelectMode.RIGHT_NORMAL);
        }
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
        if (!realNodeDom) return null;
        const previewNodeWidth = scaleNum * realNodeDom.offsetWidth - 2; // border
        const previewNodeHeight = scaleNum * realNodeDom.offsetHeight - 2;
        let previewStyle;
        // 放大模式下拖动中 previewNode 样式处理
        if (scaleNum > 1 && draggingId === id) {
            const draggingPreviewNode: HTMLElement = document.querySelector(`div[data-id='${draggingId}']`);
            if (!draggingPreviewNode) return;
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
                style={this.computeStyle()}
                className="byai-topology-node-wrapper"
                onClick={this.handleClick}
                onContextMenu={this.handleRightClick}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={() => { onMouseEnter(data) }}
                onMouseLeave={() => { onMouseLeave() }}
            >
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
            // const canDragNode = props.canDrag === false || isMatchKeyValue(props, 'canDrag', false);
            const canDragNode = props.canDrag === false || (props && props.data && props.data.extra && props.data.extra.canDrag === false);
            return canDragNode ? !canDragNode : (props.readOnly ? !props.readOnly: !canDragNode);
        },
        beginDrag(props: INodeWrapperProps) {
            const id = props.data ? props.data.id : null
            props.setDraggingId(id);
            return { id };
        },
        endDrag(props: INodeWrapperProps) {
            props.setDraggingId(null);
        },
    },
    connect => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    }),
)(WithContextNodeWrapper);
