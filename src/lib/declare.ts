import { ReactNode } from 'react';

export enum ChangeType {
    'ADD_NODE',
    'ADD_LINE',
    'LAYOUT',
    'DELETE',
    'EDIT_LINE',
    'EDIT_NODE',
}

export enum NodeTypes {
    NORMAL_NODE = '普通节点',
    TEMPLATE_NODE = '模板节点',
    ANCHOR = '锚点',
    LINE_POINT = '线段点'
}

export enum KeyCode {
    BACKSPACE = 8,
    DELETE = 46,
}
/** 选中元素类型 */
export enum SelectedType {
    NODE,
    LINE,
    NONE,
}

/** 编辑类型
 * ADD: 新增
 * EDIT_START: 编辑起点
 * EDIT_END: 编辑终点
 */
export enum LineEditType {
    ADD = 'add',
    EDIT_START = 'start',
    EDIT_END = 'end',
}

export interface IPosition {
    x: number;
    y: number;
}

export interface ITopologyNode {
    id: string;
    position?: IPosition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;
}

export interface ITopologyLine {
    start: string;
    end: string;
    color?: string;
}

export interface ITopologyContext {
    linking: boolean;
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
    anchorDecorator: (options: { anchorId?: string }) => (item: ReactNode) => ReactNode;
}

export type ValuesOf<T> = {
    [P in keyof T]?: T[P];
};
