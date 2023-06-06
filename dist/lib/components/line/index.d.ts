import React from 'react';
import { IPosition, ITopologyContext, ITopologyLine, ITopologyData } from '../../declare';
import './index.less';
interface ILineProps {
    isReduceRender?: boolean;
    start: IPosition;
    end: IPosition;
    color?: string;
    lineOffsetY?: number;
    data?: ITopologyLine;
    arrow?: boolean;
    readOnly?: boolean;
    context?: ITopologyContext;
    selected?: boolean;
    highLight?: boolean;
    onSelect?: (data: ITopologyData) => void;
    scaleNum?: number;
}
declare const _default: (props: ILineProps) => React.JSX.Element;
export default _default;
