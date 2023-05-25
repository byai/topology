import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { computeCanvasPo } from '../../utils';
// import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';
import './index.less';

export type ISelectionProps = {
  xPos?: string;
  yPos?: string;
  wrapper?: HTMLDivElement;
  visible?: boolean;
  renderTool?: () => React.ReactNode;
  toolVisible?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

type ISelectionState = {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

class Selection extends PureComponent<ISelectionProps, ISelectionState> {
  constructor(props: ISelectionProps) {
    super(props);
    this.state = {
      minX: 0,
      minY: 0,
      width: 0,
      height: 0,
    };
  }

  componentDidMount() {
    this.computeSize();
  }

  componentDidUpdate(prevProps: ISelectionProps) {
    if (prevProps.xPos !== this.props.xPos || prevProps.yPos !== this.props.yPos || prevProps.wrapper !== this.props.wrapper ) {
      this.computeSize();
    }
  }

  computeSize = () => {
    const { xPos, yPos, wrapper } = this.props;
    if (!xPos || !yPos || !wrapper) {
      return;
    }

    const xPosList = xPos.split(',').map(d => +d);
    const yPosList = yPos.split(',').map(d => +d);
    const { x: initX, y: initY } = computeCanvasPo({x: xPosList[0], y: yPosList[0]}, wrapper);
    const { x, y } = computeCanvasPo({x: xPosList[1], y: yPosList[1]}, wrapper);

    const minX = Math.min(initX, x);
    const minY = Math.min(initY, y);
    const width = Math.abs(x - initX);
    const height = Math.abs(y - initY);

    this.setState({
      minX,
      minY,
      width,
      height,
    });
  }

  render() {
    const { visible } = this.props;
    const { minX, minY, width, height } = this.state;
    return (
      <div className={classNames('byai-topology-selection', {
          visible
      })} style={{ left: `${minX}px`, top: `${minY}px`, width: `${width}px`, height: `${height}px` }}>
        {this.props.toolVisible && this.props.renderTool &&
            <div key="box-selection" ref={(node) => {
                // TODO: 还有点bug, 悬浮到其他节点时会触发
                // setTimeout(() => {
                //     node && scrollIntoViewIfNeeded(node, { behavior: 'smooth', scrollMode: 'if-needed', block: 'start'  })
                // }, 0)
            }} onClick={this.props.onClick} className={classNames("byai-topology-selection-tool")} onMouseUp={e => e.stopPropagation()}>
                {this.props.renderTool()}
            </div>
        }
      </div>
    )
  }
}

export default Selection;
