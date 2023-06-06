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
import React from 'react';
import { DragSource } from 'react-dnd';
import { NodeTypes } from '../../declare';

var TemplateWrapper = /** @class */ (function (_super) {
    __extends(TemplateWrapper, _super);
    function TemplateWrapper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TemplateWrapper.prototype.render = function () {
        var _a = this.props, connectDragSource = _a.connectDragSource, connectDragPreview = _a.connectDragPreview, children = _a.children;
        return connectDragSource((React.createElement("div", { className: "topology-template-wrapper" },
            children,
            connectDragPreview(React.createElement("div", { className: "topology-template-preview" })))));
    };
    return TemplateWrapper;
}(React.Component));
export default DragSource(NodeTypes.TEMPLATE_NODE, {
    canDrag: function (props) {
        return !props.disabled;
    },
    beginDrag: function (props) {
        return { data: props.generator() };
    },
}, function (connect) { return ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
}); })(TemplateWrapper);
//# sourceMappingURL=index.js.map