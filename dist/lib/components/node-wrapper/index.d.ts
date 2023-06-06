import React from 'react';
import { DragElementWrapper } from 'react-dnd';
import { ITopologyContext, ITopologyNode, IWrapperOptions } from '../../declare';
import './index.less';
import { SelectMode } from '../../utils/selectNodes';
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
declare const _default: any;
export default _default;
