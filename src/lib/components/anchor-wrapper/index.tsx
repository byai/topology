import React from 'react';
import { DragSource, DragElementWrapper } from 'react-dnd';
import { Consumer } from '../context';
import { NodeTypes, ITopologyContext } from '../../declare';

/* eslint-disable */
interface IAnchorWrapperProps {
    id: string;
    context?: ITopologyContext;
    readOnly?: boolean;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
}

class TopologyAnchorWrapper extends React.Component<IAnchorWrapperProps> {
    render() {
        const {
            connectDragSource,
            connectDragPreview,
            children,
            id,
        } = this.props;
        return connectDragSource(
            <div id={id} className="topology-anchor-wrapper">
                {children}
                {connectDragPreview(<div className="topology-anchor-wrapper-preview" />)}
            </div>,
        );
    }
}

const WithContext = (props: IAnchorWrapperProps) => (
    <Consumer>
        {context => <TopologyAnchorWrapper {...props} context={context} />}
    </Consumer>
);

export default DragSource(
    NodeTypes.ANCHOR,
    {
        canDrag(props: IAnchorWrapperProps) {
            return !props.readOnly ;
        },
        beginDrag(props: IAnchorWrapperProps) {
            return {
                id: props.id,
                type: NodeTypes.ANCHOR,
            };
        },
    },
    connect => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
    }),
)(WithContext);
