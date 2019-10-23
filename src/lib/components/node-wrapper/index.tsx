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
import config from '../../config';


export interface INodeWrapperProps {
    id?: string;
    data?: ITopologyNode;
    context?: ITopologyContext;
    onSelect: (node: ITopologyNode, mode: SelectMode) => void;
    children: (wrapperOptions: IWrapperOptions) => React.ReactNode;
    readOnly?: boolean;
    /** 是否孤立节点 */
    isolated?: boolean;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
}

class NodeWrapper extends React.Component<INodeWrapperProps> {
    /** 锚点自增id */
    private increaseAnchorId: number = 0;

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
    }

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
    }

    impactCheck = () => {
        const { context, data, id } = this.props;
        const { activeLine, impactNode } = context as ITopologyContext;
        if (!activeLine || !data || !id) {
            return false;
        }
        return id === impactNode;
    }

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
    }

    handleRightClick = () => {
        const { data, onSelect } = this.props;
        onSelect(data, SelectMode.RIGHT_NORMAL);
    }

    render() {
        const {
            connectDragSource,
            connectDragPreview,
            children,
            data,
            context,
        } = this.props;
        const { selectedData, activeLine } = context;
        const isSelected = selectedData.nodes.find(item => item.id === data.id) !== undefined;

        return connectDragSource((
            <div
                id={data ? `topology-node-${data.id}` : ''}
                style={this.computeStyle()}
                className="byai-topology-node-wrapper"
                onClick={this.handleClick}
                onContextMenu={this.handleRightClick}
            >
                {connectDragPreview(<div className="topology-node-preview" />)}
                <div
                    className={classnames({
                        'topology-node-content': true,
                        'topology-node-selected': isSelected,
                        'topology-node-impact': activeLine && this.impactCheck(),
                    })}
                >
                    {children({ anchorDecorator: this.anchorDecorator })}
                </div>
            </div>
        ));
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
            return !props.readOnly;
        },
        beginDrag(props: INodeWrapperProps) {
            return { id: props.data ? props.data.id : null };
        },
    },
    connect => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    }),
)(WithContextNodeWrapper);
