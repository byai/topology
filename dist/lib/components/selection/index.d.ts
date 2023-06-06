import React, { PureComponent } from 'react';
import './index.less';
export interface ISelectionProps {
    xPos?: string;
    yPos?: string;
    wrapper?: HTMLDivElement;
    visible?: boolean;
    renderTool?: () => React.ReactNode;
    toolVisible?: boolean;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}
interface ISelectionState {
    minX: number;
    minY: number;
    width: number;
    height: number;
}
declare class Selection extends PureComponent<ISelectionProps, ISelectionState> {
    constructor(props: ISelectionProps);
    componentDidMount(): void;
    componentDidUpdate(prevProps: ISelectionProps): void;
    computeSize: () => void;
    render(): React.JSX.Element;
}
export default Selection;
