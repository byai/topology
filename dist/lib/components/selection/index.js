var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { computeCanvasPo } from '../../utils';
// import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

var Selection = /** @class */ (function (_super) {
    __extends(Selection, _super);
    function Selection(props) {
        var _this = _super.call(this, props) || this;
        _this.computeSize = function () {
            var _a = _this.props, xPos = _a.xPos, yPos = _a.yPos, wrapper = _a.wrapper;
            if (!xPos || !yPos || !wrapper) {
                return;
            }
            var xPosList = xPos.split(',').map(function (d) { return +d; });
            var yPosList = yPos.split(',').map(function (d) { return +d; });
            var _b = computeCanvasPo({ x: xPosList[0], y: yPosList[0] }, wrapper), initX = _b.x, initY = _b.y;
            var _c = computeCanvasPo({ x: xPosList[1], y: yPosList[1] }, wrapper), x = _c.x, y = _c.y;
            var minX = Math.min(initX, x);
            var minY = Math.min(initY, y);
            var width = Math.abs(x - initX);
            var height = Math.abs(y - initY);
            _this.setState({
                minX: minX,
                minY: minY,
                width: width,
                height: height,
            });
        };
        _this.state = {
            minX: 0,
            minY: 0,
            width: 0,
            height: 0,
        };
        return _this;
    }
    Selection.prototype.componentDidMount = function () {
        this.computeSize();
    };
    Selection.prototype.componentDidUpdate = function (prevProps) {
        if (prevProps.xPos !== this.props.xPos || prevProps.yPos !== this.props.yPos || prevProps.wrapper !== this.props.wrapper) {
            this.computeSize();
        }
    };
    Selection.prototype.render = function () {
        var visible = this.props.visible;
        var _a = this.state, minX = _a.minX, minY = _a.minY, width = _a.width, height = _a.height;
        return (React.createElement("div", { className: classNames('byai-topology-selection', {
                visible: visible
            }), style: {
                left: "".concat(minX, "px"), top: "".concat(minY, "px"), width: "".concat(width, "px"), height: "".concat(height, "px")
            } }, this.props.toolVisible && this.props.renderTool
            && (React.createElement("div", { key: "box-selection", ref: function () {
                    // TODO: 还有点bug, 悬浮到其他节点时会触发
                    // setTimeout(() => {
                    //     node && scrollIntoViewIfNeeded(node, { behavior: 'smooth', scrollMode: 'if-needed', block: 'start'  })
                    // }, 0)
                }, onClick: this.props.onClick, className: classNames("byai-topology-selection-tool"), onMouseUp: function (e) { return e.stopPropagation(); } }, this.props.renderTool()))));
    };
    return Selection;
}(PureComponent));
export default Selection;
//# sourceMappingURL=index.js.map