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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React from 'react';
import { DragSource } from 'react-dnd';
import { Consumer } from '../context';
import { NodeTypes } from '../../declare';
var TopologyAnchorWrapper = /** @class */ (function (_super) {
    __extends(TopologyAnchorWrapper, _super);
    function TopologyAnchorWrapper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TopologyAnchorWrapper.prototype.render = function () {
        var _a = this.props, connectDragSource = _a.connectDragSource, connectDragPreview = _a.connectDragPreview, children = _a.children, id = _a.id;
        return connectDragSource(React.createElement("div", { id: id, className: "topology-anchor-wrapper" },
            children,
            connectDragPreview(React.createElement("div", { className: "topology-anchor-wrapper-preview" }))));
    };
    return TopologyAnchorWrapper;
}(React.Component));
var WithContext = function (props) { return (React.createElement(Consumer, null, function (context) { return React.createElement(TopologyAnchorWrapper, __assign({}, props, { context: context })); })); };
export default DragSource(NodeTypes.ANCHOR, {
    canDrag: function (props) {
        return !props.readOnly;
    },
    beginDrag: function (props) {
        return {
            id: props.id,
            type: NodeTypes.ANCHOR,
        };
    },
}, function (connect) { return ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
}); })(WithContext);
//# sourceMappingURL=index.js.map