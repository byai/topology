import React from 'react';
import { DragElementWrapper } from 'react-dnd';
import { ITopologyNode, ITopologyData } from '../../declare';
import './index.less';
export interface ITemplateWrapperProps {
    generator: () => ITopologyNode | ITopologyData;
    connectDragSource?: DragElementWrapper<React.ReactNode>;
    connectDragPreview?: DragElementWrapper<React.ReactNode>;
    disabled?: boolean;
}
declare const _default: any;
export default _default;
