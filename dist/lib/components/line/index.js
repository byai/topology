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
/* eslint-disable react/require-default-props */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from 'react';
import _ from 'lodash';
import { LineEditType, } from '../../declare';
import { Consumer } from '../context';
import { computeLinePath, computeTrianglePath } from '../../utils';
import config from '../../config';

var Colors = { ACTIVE: '#1F8CEC', NORMAL: '#AAB7C4' };
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { hover: false };
        _this.handleMouseEnter = function () {
            _this.setState({ hover: true });
        };
        _this.handleMouseLeave = function () {
            _this.setState({ hover: false });
        };
        _this.handleClick = function (e) {
            var _a = _this.props, selected = _a.selected, context = _a.context, data = _a.data, onSelect = _a.onSelect;
            var lines = context.selectedData.lines;
            var multi = e.metaKey || e.ctrlKey;
            if (!onSelect) {
                return;
            }
            if (!multi) {
                onSelect({
                    lines: selected ? [] : [data],
                    nodes: [],
                });
                return;
            }
            onSelect(__assign(__assign({}, context.selectedData), { lines: selected
                    ? lines.filter(function (item) { return !_.isEqual(item, data); })
                    : __spreadArray(__spreadArray([], lines, true), [data], false) }));
        };
        return _this;
    }
    Line.prototype.shouldComponentUpdate = function (nextProps) {
        var currentData = this.props.data;
        var nextData = nextProps.data, isReduceRender = nextProps.isReduceRender;
        var dragging = nextProps.context.dragging;
        if (isReduceRender && nextData === currentData && dragging) {
            return false;
        }
        return true;
    };
    Line.prototype.render = function () {
        var _a = this.props, start = _a.start, end = _a.end, selected = _a.selected, highLight = _a.highLight, data = _a.data, readOnly = _a.readOnly, lineOffsetY = _a.lineOffsetY, _b = _a.context, linking = _b.linking, activeLine = _b.activeLine;
        var hover = this.state.hover;
        var dataJson = data ? JSON.stringify({ origin: data, po: { start: start, end: end } }) : '';
        var getTriangleStart = function () { return (__assign(__assign({}, end), { y: end.y - config.line.triangleWidth })); };
        // 只高亮新增或者编辑的当前线
        var curLinking = linking && !activeLine.origin && !data;
        var lColor = highLight || selected || hover || curLinking ? Colors.ACTIVE : ((data && data.color) || Colors.NORMAL);
        var transition = linking ? 'none' : config.transition;
        return (React.createElement(React.Fragment, null,
            React.createElement("path", { onClick: this.handleClick, strokeWidth: config.line.triggerWidth, stroke: "transparent", fill: "none", style: { pointerEvents: 'all', transition: transition }, d: computeLinePath(start, getTriangleStart(), lineOffsetY), onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave }),
            React.createElement("path", { onClick: this.handleClick, strokeWidth: highLight || selected || hover ? config.line.strokeLargeWidth : config.line.strokeWidth, stroke: lColor, fill: "none", style: { pointerEvents: 'all', transition: transition }, d: computeLinePath(start, getTriangleStart(), lineOffsetY), onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave }),
            React.createElement("path", { className: readOnly ? '' : 'byai-topology-line-end-triangle', fill: lColor, stroke: "none", "data-type": LineEditType.EDIT_END, "data-json": dataJson, style: { pointerEvents: 'all', transition: transition }, d: computeTrianglePath(getTriangleStart(), config.line.triangleWidth), onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave })));
    };
    return Line;
}(React.Component));
export default (function (props) { return (React.createElement(Consumer, null, function (context) { return React.createElement(Line, __assign({}, props, { context: context })); })); });
//# sourceMappingURL=index.js.map