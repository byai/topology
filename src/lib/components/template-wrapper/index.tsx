import React from 'react';
import { DragSource, DragElementWrapper } from 'react-dnd';
import { NodeTypes, ITopologyNode } from '../../declare';
import './index.less';

export interface ITemplateWrapperProps {
    generator: () => ITopologyNode;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
}

class TemplateWrapper extends React.Component<ITemplateWrapperProps> {
    render() {
        const {
            connectDragSource,
            connectDragPreview,
            children,
        } = this.props;

        return connectDragSource((
            <div className="topology-template-wrapper">
                {children}
                {connectDragPreview(<div className="topology-template-preview" />)}
            </div>
        ));
    }
}

export default DragSource(
    NodeTypes.TEMPLATE_NODE,
    {
        canDrag() {
            return true;
        },
        beginDrag(props: ITemplateWrapperProps) {
            return { data: props.generator() };
        },
    },
    connect => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    }),
)(TemplateWrapper);
