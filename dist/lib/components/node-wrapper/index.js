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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React from 'react';
import { DragSource } from 'react-dnd';
import classnames from 'classnames';
import AnchorWrapper from '../anchor-wrapper';
import { Consumer } from '../context';
import { NodeTypes, } from '../../declare';

import { SelectMode } from '../../utils/selectNodes';
import { getRealNodeDom, isMatchKeyValue } from '../../utils';
import config from '../../config';
var NodeWrapper = /** @class */ (function (_super) {
    __extends(NodeWrapper, _super);
    function NodeWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** 锚点自增id */
        _this.increaseAnchorId = 0;
        _this.updateNumber = 0;
        _this.computeStyle = function () {
            var _a = _this.props, data = _a.data, isolated = _a.isolated;
            if (!data) {
                return undefined;
            }
            data.position = data.position || { x: 0, y: 0 };
            return {
                position: 'absolute',
                left: data.position.x,
                top: data.position.y,
                transition: config.transition,
                zIndex: isolated ? 999 : undefined,
            };
        };
        _this.anchorDecorator = function (options) {
            var _a = _this.props, id = _a.id, readOnly = _a.readOnly;
            var anchorId = options.anchorId || (_this.increaseAnchorId += 1);
            return function (item) { return (React.createElement(AnchorWrapper, { key: "".concat(id, "-").concat(anchorId), id: "".concat(id, "-").concat(anchorId), readOnly: readOnly }, item)); };
        };
        _this.impactCheck = function () {
            var _a = _this.props, context = _a.context, data = _a.data, id = _a.id;
            var _b = context, activeLine = _b.activeLine, impactNode = _b.impactNode;
            if (!activeLine || !data || !id) {
                return false;
            }
            return id === impactNode;
        };
        _this.handleClick = function (e) {
            // 避免一些交互上的冲突,改为mousedown触发
            var _a = _this.props, data = _a.data, onSelect = _a.onSelect, closeBoxSelection = _a.closeBoxSelection;
            closeBoxSelection === null || closeBoxSelection === void 0 ? void 0 : closeBoxSelection();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                onSelect(data, SelectMode.MULTI);
                return;
            }
            if (e.ctrlKey || e.metaKey) {
                onSelect(data, SelectMode.MUL_NORMAL);
                return;
            }
            if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
                onSelect(data, SelectMode.BOX_SELECTION);
                return;
            }
            onSelect(data, SelectMode.NORMAL);
        };
        _this.handleMouseDown = function (e) {
            var _a = _this.props, data = _a.data, onSelect = _a.onSelect, closeBoxSelection = _a.closeBoxSelection;
            if (e.button === 2) {
                closeBoxSelection === null || closeBoxSelection === void 0 ? void 0 : closeBoxSelection();
                e.preventDefault();
                onSelect(data, SelectMode.RIGHT_NORMAL);
            }
            // const { data, onSelect, closeBoxSelection } = this.props;
            // closeBoxSelection();
            // if (e.button === 2) {
            //     e.preventDefault();
            //     onSelect(data, SelectMode.RIGHT_NORMAL);
            //     return;
            // }
            // if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            //     onSelect(data, SelectMode.MULTI);
            //     return;
            // }
            // if (e.ctrlKey || e.metaKey) {
            //     onSelect(data, SelectMode.MUL_NORMAL);
            //     return;
            // }
            // if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
            //     onSelect(data, SelectMode.BOX_SELECTION);
            //     return;
            // }
            // if (!isSelect) {
            //     onSelect(data, SelectMode.NORMAL);
            // }
        };
        _this.handleRightClick = function (e) {
            e.preventDefault();
        };
        /**
         * set preview Dom width height style
         */
        /* eslint-disable */
        _this.getPreviewNodeStyle = function () {
            var _a = _this.props, data = _a.data, scaleNum = _a.scaleNum, id = _a.id, draggingId = _a.draggingId;
            var realNodeDom = document.getElementById("topology-node-".concat(data && data.id));
            if (!realNodeDom)
                return null;
            var previewNodeWidth = scaleNum * realNodeDom.offsetWidth - 2; // border
            var previewNodeHeight = scaleNum * realNodeDom.offsetHeight - 2;
            var previewStyle = {};
            // 放大模式下拖动中 previewNode 样式处理
            if (scaleNum > 1 && draggingId === id) {
                var draggingPreviewNode_1 = document.querySelector("div[data-id='".concat(draggingId, "']"));
                if (!draggingPreviewNode_1)
                    return null;
                setTimeout(function () {
                    draggingPreviewNode_1.style.background = 'transparent';
                    draggingPreviewNode_1.style.border = 'none';
                }, 0);
            }
            // 连线触发节点或者放大时对未拖动中 previewNode 样式处理
            if (_this.impactCheck() || (scaleNum > 1 && draggingId !== id)) {
                previewStyle = {
                    background: 'transparent',
                    border: 'none'
                };
            }
            return __assign({ width: previewNodeWidth, height: previewNodeHeight }, previewStyle);
        };
        return _this;
    }
    NodeWrapper.prototype.shouldComponentUpdate = function (nextprops) {
        var nextData = nextprops.data, _a = nextprops.context, nextSelectedData = _a.selectedData, nextImpactNode = _a.impactNode, isReduceRender = nextprops.isReduceRender;
        var _b = this.props, data = _b.data, _c = _b.context, selectedData = _c.selectedData, impactNode = _c.impactNode;
        if (impactNode && impactNode === nextImpactNode) {
            this.updateNumber += 1;
        }
        else {
            this.updateNumber = 0;
        }
        // 避免节点多次无用渲染
        if (isReduceRender && !impactNode && nextData === data && nextSelectedData === selectedData) {
            return false;
        }
        if (this.updateNumber >= 2) {
            return false;
        }
        return true;
    };
    NodeWrapper.prototype.render = function () {
        var _this = this;
        var _a = this.props, connectDragSource = _a.connectDragSource, connectDragPreview = _a.connectDragPreview, children = _a.children, data = _a.data, context = _a.context, id = _a.id, onMouseEnter = _a.onMouseEnter, onMouseLeave = _a.onMouseLeave;
        var selectedData = context.selectedData, activeLine = context.activeLine;
        var isSelected = selectedData.nodes.find(function (item) { return item.id === data.id; }) !== undefined;
        return connectDragSource(React.createElement("div", { id: data ? "topology-node-".concat(data.id) : "", "data-combine-id": data === null || data === void 0 ? void 0 : data.combineId, style: this.computeStyle(), className: "byai-topology-node-wrapper", onClick: this.handleClick, onContextMenu: this.handleRightClick, onMouseDown: function (e) {
                // @ts-ignore
                _this.handleMouseDown(e, isSelected);
            }, onMouseEnter: function () { onMouseEnter(data); }, onMouseLeave: function () { onMouseLeave(); } },
            connectDragPreview(React.createElement("div", { "data-id": "".concat(id), style: this.getPreviewNodeStyle(), className: "topology-node-preview" })),
            React.createElement("div", { className: classnames({
                    "topology-node-content": true,
                    "topology-node-selected": isSelected,
                    "topology-node-impact": activeLine && this.impactCheck()
                }) }, children({ anchorDecorator: this.anchorDecorator }))));
    };
    return NodeWrapper;
}(React.Component));
var WithContextNodeWrapper = function (props) { return (React.createElement(Consumer, null, function (context) { return React.createElement(NodeWrapper, __assign({}, props, { context: context })); })); };
export default DragSource(NodeTypes.NORMAL_NODE, {
    canDrag: function (props) {
        var canDragNode = props.canDrag === false || isMatchKeyValue(props, 'canDrag', false);
        return canDragNode ? !canDragNode : (props.readOnly ? !props.readOnly : !canDragNode);
    },
    beginDrag: function (props) {
        var id = props.data ? props.data.id : null;
        var _a = props.prevNodeStyle, prevNodeStyle = _a === void 0 ? {} : _a, closeBoxSelection = props.closeBoxSelection;
        closeBoxSelection === null || closeBoxSelection === void 0 ? void 0 : closeBoxSelection();
        props.setDraggingId(id);
        // beginDrag 时机 处理预览节点样式问题
        var draggingPreviewNode = document.querySelector("div[data-id='".concat(id, "']"));
        if (!draggingPreviewNode)
            return null;
        var realNodeDom = getRealNodeDom(id);
        if (!realNodeDom)
            return null;
        var distanceX = 0;
        var distanceY = 0;
        var source;
        if (!props.isSelected) {
            source = props.onSelect(props.data, SelectMode.NORMAL);
        }
        var otherRealNodeDomList = (source ? source.nodes : props.selectedNodes).filter(function (item) { return item.id !== id; }).map(function (item) { return getRealNodeDom(item.id); });
        var allRealNodeDomList = __spreadArray(__spreadArray([], otherRealNodeDomList, true), [realNodeDom], false);
        var width = realNodeDom.offsetWidth;
        var height = realNodeDom.offsetHeight;
        if (otherRealNodeDomList.length > 0) {
            var boxPosition = props.getBoundary(allRealNodeDomList);
            var _b = realNodeDom.getBoundingClientRect(), x = _b.x, y = _b.y;
            distanceX = x - boxPosition.minX;
            distanceY = y - boxPosition.minY;
            width = boxPosition.maxX - boxPosition.minX;
            height = boxPosition.maxY - boxPosition.minY;
        }
        var previewNodeWidth = width - 2; // border
        var previewNodeHeight = height - 2;
        draggingPreviewNode.style.background = prevNodeStyle.background || '#6f6fc7';
        draggingPreviewNode.style.border = prevNodeStyle.border || '1px dashed #1F8CEC';
        draggingPreviewNode.style.setProperty('--width', previewNodeWidth + 'px');
        draggingPreviewNode.style.setProperty('--height', previewNodeHeight + 'px');
        draggingPreviewNode.style.setProperty('--transformX', "".concat(-distanceX, "px"));
        draggingPreviewNode.style.setProperty('--transformY', "".concat(-distanceY, "px"));
        // 恢复
        setTimeout(function () {
            draggingPreviewNode.style.background = 'transparent';
            draggingPreviewNode.style.border = 'none';
        }, 0);
        return { id: id };
    },
    endDrag: function (props) {
        props.setDraggingId(null);
        var id = props.data ? props.data.id : null;
        props.showBoxSelection && props.showBoxSelection();
        var draggingPreviewNode = document.querySelector("div[data-id='".concat(id, "']"));
        if (!draggingPreviewNode)
            return null;
        draggingPreviewNode.style.setProperty('--width', '100%');
        draggingPreviewNode.style.setProperty('--height', '100%');
        draggingPreviewNode.style.setProperty('--transformX', '0px');
        draggingPreviewNode.style.setProperty('--transformY', '0px');
    },
}, function (connect) { return ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
}); })(WithContextNodeWrapper);
//# sourceMappingURL=index.js.map