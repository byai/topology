import { ReactNode } from 'react';
export declare enum ChangeType {
    'ADD_NODE' = 0,
    'ADD_LINE' = 1,
    'LAYOUT' = 2,
    'DELETE' = 3,
    'EDIT_LINE' = 4,
    'EDIT_NODE' = 5,
    'ADD_COMPONENT' = 6
}
export declare enum NodeTypes {
    NORMAL_NODE = "\u666E\u901A\u8282\u70B9",
    TEMPLATE_NODE = "\u6A21\u677F\u8282\u70B9",
    ANCHOR = "\u951A\u70B9",
    LINE_POINT = "\u7EBF\u6BB5\u70B9"
}
export declare enum KeyCode {
    BACKSPACE = 8,
    DELETE = 46
}
/** 选中元素类型 */
export declare enum SelectedType {
    NODE = 0,
    LINE = 1,
    NONE = 2
}
/** 编辑类型
 * ADD: 新增
 * EDIT_START: 编辑起点
 * EDIT_END: 编辑终点
 */
export declare enum LineEditType {
    ADD = "add",
    EDIT_START = "start",
    EDIT_END = "end"
}
export interface IPosition {
    x: number;
    y: number;
}
export interface ITopologyNode {
    id: string;
    position?: IPosition;
    canDrag?: boolean;
    dragChild?: boolean;
    filterOverlap?: boolean;
    /** 组件Id */
    combineId?: string;
    [prop: string]: any;
}
export interface ITopologyLine {
    start: string;
    end: string;
    color?: string;
    index?: number;
    /** 组件Id */
    combineId?: string;
}
export interface ITopologyContext {
    linking: boolean;
    dragging: boolean;
    impactNode: string | null;
    readOnly: boolean;
    hoverCurrentNode: ITopologyNode;
    activeLine: {
        start: IPosition;
        end: IPosition;
        type: LineEditType;
        /** 原始值 */
        origin: ITopologyLine | null;
    } | null;
    activeNode?: string;
    selectedData: {
        nodes: ITopologyNode[];
        lines: ITopologyLine[];
    };
}
export interface ITopologyData {
    nodes: ITopologyNode[];
    lines: ITopologyLine[];
}
export interface IWrapperOptions {
    anchorDecorator: (options: {
        anchorId?: string;
    }) => (item: ReactNode) => ReactNode;
}
export type ValuesOf<T> = {
    [P in keyof T]?: T[P];
};
