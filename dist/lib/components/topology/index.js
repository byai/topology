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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
/* eslint-disable */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropTarget } from 'react-dnd';
import _ from 'lodash';
import classnames from 'classnames';
import html2canvas from 'html2canvas';
import selectNodes, { getLinesFromNode, SelectMode } from '../../utils/selectNodes';
import { Provider, defaultContext } from '../context';
import NodeWrapper from '../node-wrapper';
import Line from '../line';
import LineText from '../line/lineText';
import { KeyCode, NodeTypes, ChangeType, LineEditType, } from '../../declare';
import { computeCanvasPo, impactCheck, computeAnchorPo, computeNodeInputPo, computeContentCenter, computeContentPostionY, createHashFromObjectArray, getNodeSize, shouldAutoLayout, getRealNodeDom, getMaxAndMinNodeId, isInViewPort, computeMaxAndMin, isMatchKeyValue, } from '../../utils';
// import layoutCalculation from '../../utils/layoutCalculation';
import computeLayout from '../../utils/computeLayout';
import deleteSelectedData from '../../utils/deleteSelectedData';
import config from '../../config';

import Selection from '../selection';
import SnapLine from '../snapline';
var MAX_SCALE = 2;
var MIN_SCALE = 0.1;
var DRAG_CLASS = 'topology-canvas-drag';
var initialTopologyState = {
    context: defaultContext,
    scaleNum: 1,
    draggingId: null,
    loading: false,
    alignmentLines: {}
};
var Topology = /** @class */ (function (_super) {
    __extends(Topology, _super);
    function Topology(props) {
        var _this = _super.call(this, props) || this;
        _this.nodeSizeCache = {};
        _this.state = initialTopologyState;
        _this.dragCanvasPo = null;
        _this.shouldAutoLayout = false;
        _this.onChange = function (data, type) {
            var onChange = _this.props.onChange;
            if (!onChange) {
                return;
            }
            onChange(data, type);
        };
        _this.defaultScaleNum = 1;
        _this.scaleNum = 1;
        _this.clearSelectedWhenClickOutside = function (e) {
            if (_this.$topology.contains(e.target)) {
                return;
            }
            _this.clearSelectData();
        };
        _this.zoomIn = function () {
            _this.setState(function (prevState) {
                var scaleNum = prevState.scaleNum > MIN_SCALE + 0.1 ? prevState.scaleNum - 0.1 : MIN_SCALE;
                _this.scaleNum = scaleNum;
                return { scaleNum: scaleNum };
            });
            _this.setDraggingId(null);
        };
        _this.zoomOut = function () {
            _this.setState(function (prevState) {
                var scaleNum = prevState.scaleNum < MAX_SCALE ? prevState.scaleNum + 0.1 : MAX_SCALE;
                _this.scaleNum = scaleNum;
                return { scaleNum: scaleNum };
            });
            _this.setDraggingId(null);
        };
        _this.resetScale = function () {
            _this.setState(function () {
                var defaultScaleNum = _this.defaultScaleNum;
                _this.scaleNum = defaultScaleNum;
                return { scaleNum: defaultScaleNum };
            });
            _this.setDraggingId(null);
        };
        _this.scrollCanvasToCenter = function () {
            if (!_this.$wrapper || !_this.$canvas) {
                return;
            }
            _this.resetScale();
            var canvasSize = getNodeSize(_this.$canvas);
            var wrapperSize = getNodeSize(_this.$wrapper);
            var contentCenter = computeContentCenter(_this.props.data.nodes);
            var canvasCenter = {
                x: canvasSize.width / 2,
                y: canvasSize.height / 2
            };
            var defaultScrollTop = (canvasSize.height - wrapperSize.height) / 2;
            var defaultScrollLeft = (canvasSize.width - wrapperSize.width) / 2;
            if (!contentCenter) {
                _this.$wrapper.scrollTop = defaultScrollTop;
                _this.$wrapper.scrollLeft = defaultScrollLeft;
            }
            else {
                _this.$wrapper.scrollTop = defaultScrollTop + (contentCenter.y - canvasCenter.y);
                _this.$wrapper.scrollLeft = defaultScrollLeft + (contentCenter.x - canvasCenter.x);
            }
        };
        /**
         *  定位至画布顶部距离
         * @returns
         */
        _this.scrollCanvasToPositionY = function () {
            if (!_this.$wrapper || !_this.$canvas) {
                return;
            }
            _this.resetScale();
            var canvasSize = getNodeSize(_this.$canvas);
            var wrapperSize = getNodeSize(_this.$wrapper);
            var contentPosition = computeContentPostionY(_this.props.data.nodes);
            var canvasCenter = {
                x: canvasSize.width / 2,
                y: canvasSize.height / 2
            };
            var defaultScrollTop = (canvasSize.height - wrapperSize.height) / 2;
            var defaultScrollLeft = (canvasSize.width - wrapperSize.width) / 2;
            if (!contentPosition) {
                _this.$wrapper.scrollTop = defaultScrollTop;
                _this.$wrapper.scrollLeft = defaultScrollLeft;
            }
            else {
                _this.$wrapper.scrollTop = contentPosition.y - _this.props.customPostionHeight;
                _this.$wrapper.scrollLeft = defaultScrollLeft + (contentPosition.x - canvasCenter.x);
            }
        };
        _this.cacheNodeSize = function () {
            var nodes = _this.props.data.nodes;
            // 已节点id为键值，缓存节点的宽和高，避免碰撞检测时频繁操作DOM
            _this.nodeSizeCache = nodes.reduce(function (pre, cur) {
                var _a;
                return (__assign(__assign({}, pre), (_a = {}, _a[cur.id] = getNodeSize(cur.id), _a)));
            }, {});
        };
        _this.impactCheck = function (endPo, startPo, id) {
            var _a = _this.props.data, nodes = _a.nodes, lines = _a.lines;
            var impactNode = nodes.find(function (item) {
                if (!_this.nodeSizeCache[item.id]) {
                    _this.nodeSizeCache[item.id] = getNodeSize(item.id);
                }
                return (_this.nodeSizeCache[item.id]
                    && impactCheck(endPo, _this.nodeSizeCache[item.id], item.position));
            });
            // 起点和终点是同一节点
            if (impactNode
                && impactCheck(startPo, _this.nodeSizeCache[impactNode.id], impactNode.position)) {
                return null;
            }
            // 线已存在情况下
            var hasExistSameLine = impactNode && lines.find(function (item) { return item.start === id && item.end === impactNode.id; });
            if (hasExistSameLine)
                return null;
            // 节点不可被连接
            if (impactNode && impactNode.canConnect === false)
                return null;
            return impactNode ? impactNode.id : null;
        };
        _this.clearSelectData = function () {
            var _a = _this.state.context.selectedData, nodes = _a.nodes, lines = _a.lines;
            if ((nodes === null || nodes === void 0 ? void 0 : nodes.length) === 0 && (lines === null || lines === void 0 ? void 0 : lines.length) === 0)
                return;
            _this.setContext({ selectedData: { nodes: [], lines: [], } }, function () {
                var onSelect = _this.props.onSelect;
                if (onSelect) {
                    onSelect(_this.state.context.selectedData);
                }
            });
        };
        _this.autoLayout = function () {
            var _a = _this.props, data = _a.data, sortChildren = _a.sortChildren;
            _this.resetScale();
            _this.onChange(__assign(__assign({}, data), { nodes: computeLayout(data, { sortChildren: sortChildren }) }), ChangeType.LAYOUT);
            _this.clearSelectData(); // refresh
        };
        _this.initDomEvents = function () {
            window.addEventListener("keydown", _this.handleKeydown);
        };
        _this.removeDomEvents = function () {
            window.removeEventListener("keydown", _this.handleKeydown);
        };
        _this.getBoundary = function (elements) {
            var minX = Infinity;
            var minY = Infinity;
            var maxX = -Infinity;
            var maxY = -Infinity;
            elements.forEach(function (e) {
                var _a = e.getBoundingClientRect(), x = _a.x, y = _a.y, height = _a.height, width = _a.width;
                minX = Math.min(x, minX);
                minY = Math.min(y, minY);
                maxX = Math.max(x + width, maxX);
                maxY = Math.max(y + height, maxY);
            });
            return {
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            };
        };
        _this.getRealNodeDomByIdList = function (ids) {
            return ids.map(getRealNodeDom);
        };
        _this.generateBoxByRealSelectedNodeDom = function (elements, offset) {
            if (offset === void 0) { offset = 3; }
            var boundary = _this.getBoundary(elements || _this.state.realDragNodeDomList);
            setTimeout(function () {
                _this.generateBoxByBoundary(boundary, offset);
            }, 0);
        };
        _this.generateBoxByBoundary = function (boundary, offset) {
            if (offset === void 0) { offset = 3; }
            var minX = boundary.minX, minY = boundary.minY, maxX = boundary.maxX, maxY = boundary.maxY;
            _this.setState({
                boxSelectionInfo: {
                    initX: minX - offset,
                    initY: minY - offset,
                    x: maxX + offset,
                    y: maxY + offset,
                    status: 'static',
                }
            });
        };
        _this.generateBoxBySelectedNode = function (nodes, offset) {
            nodes = nodes || _this.state.context.selectedData.nodes;
            offset = offset || 3;
            if (nodes.length === 0) {
                _this.setState({
                    boxSelectionInfo: null
                });
                return;
            }
            _this.generateBoxByRealSelectedNodeDom(_this.getRealNodeDomByIdList(nodes.map(function (n) { return n.id; })), offset);
        };
        _this.handleKeydown = function (e) {
            // eslint-disable-next-line
            var _a = e.target.classList, classList = _a === void 0 ? [] : _a;
            // 左侧的搜索输入框回删事件不触发话术更改
            if (classList[0] === "ant-input") {
                return;
            }
            switch (e.keyCode) {
                case KeyCode.BACKSPACE:
                case KeyCode.DELETE:
                    _this.deleteItem();
                    break;
                default:
                    break;
            }
        };
        _this.deleteItem = function () {
            var data = _this.props.data;
            var selectedData = _this.state.context.selectedData;
            _this.onChange(deleteSelectedData(data, selectedData), ChangeType.DELETE);
            _this.closeBoxSelection();
        };
        _this.setDraggingId = function (id) {
            _this.setState({
                draggingId: id,
            });
        };
        _this.setContext = function (values, callback) {
            var context = _this.state.context;
            _this.setState({ context: __assign(__assign({}, context), values) }, function () {
                if (callback) {
                    callback();
                }
            });
        };
        _this.refreshSelectNode = function (data) {
            var selectedData = _this.state.context.selectedData;
            var onSelect = _this.props.onSelect;
            var idSet = new Set(selectedData.nodes.map(function (item) { return item.id; }));
            var newNodeInfo = data.nodes.filter(function (n) { return idSet.has(n.id); });
            var newInfo = {
                nodes: newNodeInfo,
                lines: selectedData.lines,
            };
            _this.setContext({
                selectedData: newInfo,
            }, function () {
                if (onSelect) {
                    onSelect(newInfo);
                }
            });
        };
        _this.selectNode = function (node, mode) {
            var _a = _this.props, data = _a.data, onSelect = _a.onSelect;
            var selectedData = _this.state.context.selectedData;
            var selectNodesId = selectedData.nodes.map(function (item) { return item.id; });
            if (mode === SelectMode.RIGHT_NORMAL
                && selectNodesId.indexOf(node.id) !== -1) {
                onSelect(selectedData);
                return selectedData;
            }
            var selectData = selectNodes({ data: data, selectedData: selectedData })({
                node: node,
                mode: mode
            });
            _this.setContext({
                selectedData: selectData,
            }, function () {
                if (mode === SelectMode.BOX_SELECTION) {
                    _this.generateBoxBySelectedNode(_this.state.context.selectedData.nodes);
                }
                if (onSelect) {
                    onSelect(_this.state.context.selectedData);
                }
            });
            return selectData;
        };
        _this.selectNodesForSelection = function () {
        };
        _this.selectLine = function (data) {
            _this.setContext({
                selectedData: data
            }, function () {
                var onSelect = _this.props.onSelect;
                if (onSelect) {
                    onSelect(_this.state.context.selectedData);
                }
            });
        };
        _this.dragCanvas = function (clientX, clientY) {
            if (!_this.$wrapper) {
                return;
            }
            var dX = _this.dragCanvasPo.x - clientX;
            var dY = _this.dragCanvasPo.y - clientY;
            _this.dragCanvasPo = { x: clientX, y: clientY };
            _this.$wrapper.scrollTop = _this.$wrapper.scrollTop + dY;
            _this.$wrapper.scrollLeft = _this.$wrapper.scrollLeft + dX;
        };
        _this.editLine = function (clientX, clientY) {
            var _a;
            var activeLine = _this.state.context.activeLine;
            if (!_this.$wrapper || !activeLine) {
                return;
            }
            var clientPo = computeCanvasPo({
                x: clientX,
                y: clientY,
            }, _this.$wrapper);
            var impactNode = _this.impactCheck(clientPo, activeLine[activeLine.type === LineEditType.EDIT_START ? "end" : "start"]);
            _this.setContext({
                impactNode: impactNode,
                activeLine: __assign(__assign({}, activeLine), (_a = {}, _a[activeLine.type] = clientPo, _a))
            });
        };
        _this.handleHoverCurrentNode = function (node) {
            _this.setContext({
                hoverCurrentNode: node
            });
        };
        _this.isSelected = function (id) {
            var selectedData = _this.state.context.selectedData;
            return selectedData.nodes.some(function (item) { return item.id === id; });
        };
        _this.clearHoverCurrentNode = function () {
            _this.setContext({
                hoverCurrentNode: null
            });
        };
        _this.handleMouseDown = function (e) {
            if (e.button === 2) { // 检查是否右键
                _this.setState({
                    boxSelectionInfo: {
                        initX: e.clientX,
                        initY: e.clientY,
                        x: e.clientX,
                        y: e.clientY,
                        status: 'drag',
                    }
                });
                return;
            }
            // @ts-ignore
            var itemType = e.target.getAttribute("data-type");
            // @ts-ignore
            var className = e.target.className;
            var getClickType = function () {
                // @ts-ignore
                if (
                // @ts-ignore
                [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(itemType || "")) {
                    return "CLICK_LINE_POINT";
                }
                else if (typeof className === "string"
                    && className.includes("topology-canvas")) {
                    return "CLICK_CANVAS";
                }
                return "";
            };
            switch (getClickType()) {
                case "CLICK_CANVAS":
                    _this.dragCanvasPo = { x: e.clientX, y: e.clientY };
                    // this.$topology
                    _this.$canvas.classList.add(DRAG_CLASS);
                    break;
                case "CLICK_LINE_POINT":
                    if (_this.props.readOnly) {
                        break;
                    }
                    try {
                        // @ts-ignore
                        var jsonStr = e.target.getAttribute("data-json");
                        if (typeof jsonStr !== "string" || !jsonStr) {
                            throw new Error("线段起点无数据");
                        }
                        var _a = JSON.parse(jsonStr), origin_1 = _a.origin, po = _a.po;
                        _this.setContext({
                            linking: true,
                            activeLine: {
                                origin: origin_1,
                                start: po.start,
                                end: po.end,
                                type: itemType
                            }
                        });
                    }
                    catch (err) {
                        // eslint-disable-next-line no-console
                        console.log(err);
                    }
                    break;
                default:
                    break;
            }
        };
        _this.handleMouseMove = function (e) {
            e.persist();
            if (!!_this.state.boxSelectionInfo && _this.state.boxSelectionInfo.status === 'drag') {
                _this.setState(function (prev) {
                    return {
                        boxSelectionInfo: __assign(__assign({}, prev.boxSelectionInfo), { x: e.clientX, y: e.clientY })
                    };
                });
                return;
            }
            var activeLine = _this.state.context.activeLine;
            // @ts-ignore
            var isEditingLine = activeLine
                // @ts-ignore
                && [LineEditType.EDIT_START, LineEditType.EDIT_END].includes(activeLine.type);
            var isDraggingCanvas = _this.dragCanvasPo;
            if (!isDraggingCanvas) {
                _this.$canvas.classList.remove(DRAG_CLASS);
            }
            if (!isEditingLine && !isDraggingCanvas) {
                return;
            }
            if (isDraggingCanvas) {
                _this.dragCanvas(e.clientX, e.clientY);
            }
            if (isEditingLine && !_this.props.readOnly) {
                _this.editLine(e.clientX, e.clientY);
            }
        };
        _this.samePostionLinesLength = function (curLine) {
            var lines = _this.props.data.lines;
            return lines && lines.filter(function (item) { return item.start.split('-')[0] === curLine.start.split('-')[0] && item.end === curLine.end; }).length;
        };
        _this.getLineRepeatIndex = function (curLine) {
            var startPointAnchorId = _this.props.startPointAnchorId;
            // 所有线条起始点与 startPointAnchorId 线条一致情况下，增加线条位置重复次数属性
            var index = startPointAnchorId !== undefined && _this.samePostionLinesLength(curLine) ? { index: _this.samePostionLinesLength(curLine) } : {};
            return index;
        };
        _this.inSelection = function (selectionPositionGroup, nodePositionGroup) {
            var selectionLeftTopPosition = selectionPositionGroup[0], selectionRightBottomPosition = selectionPositionGroup[1];
            var nodeLeftTopPosition = nodePositionGroup[0], nodeRightBottomPosition = nodePositionGroup[1];
            return (nodeLeftTopPosition.x > selectionLeftTopPosition.x
                && nodeLeftTopPosition.y > selectionLeftTopPosition.y
                && nodeRightBottomPosition.x < selectionRightBottomPosition.x
                && nodeRightBottomPosition.y < selectionRightBottomPosition.y);
        };
        _this.getBoxPositionGroup = function () {
            if (!_this.state.boxSelectionInfo) {
                return undefined;
            }
            var _a = _this.state.boxSelectionInfo, initX = _a.initX, initY = _a.initY, x = _a.x, y = _a.y;
            var selectionLeftTopPosition = {
                x: Math.min(initX, x),
                y: Math.min(initY, y),
            };
            var selectionRightBottomPosition = {
                x: Math.max(initX, x),
                y: Math.max(initY, y),
            };
            return [selectionLeftTopPosition, selectionRightBottomPosition];
        };
        _this.getNodeDomList = function () {
            return __spreadArray([], _this.$canvas.querySelectorAll('[id^="topology-node-"]'), true);
        };
        _this.getCombineNode = function (combineId) {
            if (!combineId) {
                return [];
            }
            return _this.props.data.nodes.filter(function (item) { return item.combineId === combineId; });
        };
        // getShouldSelectedNodeList函数：获取框选中的节点列表
        _this.getShouldSelectedNodeList = function () {
            // Step 1: 获取box(矩形选择框)的位置信息(boxPositionGroup)和需要筛选的DOM列表(nodeList)
            var boxPositionGroup = _this.getBoxPositionGroup();
            var ret = {
                nativeNodeList: [],
                selectedNodeList: [],
                boxPositionGroup: boxPositionGroup,
            };
            // 如果没有筛选框的位置信息，则直接返回空；否则，获取框选中的节点列表进行下一步处理
            if (!boxPositionGroup) {
                return ret;
            }
            var nodeList = _this.getNodeDomList();
            // Step 2: 筛选出所有与box相交的节点(nativeNodeList)，以及属于这些节点所属的整合组合的集合(combineIdSet)
            var nativeNodeList = nodeList.filter(function (node) {
                var info = node.getBoundingClientRect();
                var nodePositionLeftTop = {
                    x: info.x,
                    y: info.y,
                };
                var nodePositionRightBottom = {
                    x: info.x + info.width,
                    y: info.y + info.height,
                };
                var nodePositionGroup = [nodePositionLeftTop, nodePositionRightBottom];
                return _this.inSelection(boxPositionGroup, nodePositionGroup);
            });
            var combineIdSet = new Set(nativeNodeList.map(function (node) { return node.dataset.combineId; }).filter(function (id) { return !!id; })); // 把每个有'data-combine-id'属性的HTML节点转化为数组后，筛选出仅由combileId的(无重复)集合combineIdSet
            // Step 3: 将筛选后的结果flat化、去重和拼接之后，以id形式存储在shouldSelectedNodeIdList中
            var combineIdList = [];
            combineIdSet.forEach(function (id) {
                combineIdList.push(id);
            });
            var shouldSelectedNodeIdList = nativeNodeList.map(function (n) { return n.firstChild; }).map(function (node) { return node.dataset.id; }); // 把所有HTML节点的第一个子元素，即头部节点的'data-id'属性放进shouldSelectedNodeIdList中
            _this.props.data.nodes.forEach(function (node) {
                if (combineIdSet.has(node.combineId)) {
                    shouldSelectedNodeIdList.push(node.id);
                }
            });
            // Step 4: 把结果与props.data.nodes中的节点进行比较并存储下来(selectedNodeList是把筛选过的节点的详细信息添加到一个新对象(IWidgetNode)构成的列表里)
            var idSet = new Set(shouldSelectedNodeIdList);
            var selectedNodeList = [];
            // 找到所有被选中的节点子节点
            _this.props.data.nodes.forEach(function (node) {
                if (idSet.has(node.id) && isMatchKeyValue(node, 'dragChild', true)) {
                    _this.props.data.lines.forEach(function (line) {
                        if (line.start.split('-')[0] === node.id) {
                            idSet.add(line.end);
                        }
                    });
                }
            });
            _this.props.data.nodes.forEach(function (node) {
                if (idSet.has(node.id)) {
                    selectedNodeList.push(node);
                }
            });
            // Step 5: 返回所有需要返回的信息(nativeNodeList, selectedNodeList, boxPositionGroup)，其中nativeNodeList中是从nodeList-filter-domNodeList里面经过box筛选后得到的HTML节点，selectedNodeList则是把选中节点详细存储到一个对象构成的列表里
            ret.nativeNodeList = nodeList.filter(function (node) { return idSet.has(node.firstChild.dataset.id); });
            ret.selectedNodeList = selectedNodeList;
            return ret;
        };
        _this.couldDispatchContextMenuEvent = function (e) {
            if (e.button !== 2) {
                return false;
            }
            if (_this.state.boxSelectionInfo && (Math.abs(_this.state.boxSelectionInfo.initX - e.clientX) > 3 || Math.abs(_this.state.boxSelectionInfo.initY - e.clientY) > 3)) {
                return false;
            }
            return true;
        };
        _this.closeBoxSelection = function () {
            _this.setState(_this.state.boxSelectionInfo ? { boxVisibleFlag: true, boxSelectionInfo: null } : { boxSelectionInfo: null });
        };
        _this.showBoxSelection = function () {
            if (_this.state.boxVisibleFlag) {
                _this.setState({
                    boxVisibleFlag: false
                });
                _this.generateBoxBySelectedNode();
            }
        };
        _this.handleMouseUp = function (e) {
            var _a = _this.props, lines = _a.data.lines, readOnly = _a.readOnly;
            var clientX = e.clientX, clientY = e.clientY, screenX = e.screenX, screenY = e.screenY, button = e.button, buttons = e.buttons;
            _this.$canvas.classList.remove(DRAG_CLASS);
            var boxSelectionInfo = _this.state.boxSelectionInfo;
            var shouldOpenContextMenuFlag = _this.couldDispatchContextMenuEvent(e);
            var isMultiClick = e.ctrlKey || e.metaKey || e.shiftKey;
            var isDragBox = boxSelectionInfo && boxSelectionInfo.status === 'drag' && !shouldOpenContextMenuFlag;
            var isEmitByNodeWrapper = function () {
                var target = e.target;
                while (target.className !== e.currentTarget.className && target !== document.body) {
                    if (target.className.indexOf('topology-node-content') > -1) {
                        return true;
                    }
                    target = target.parentElement;
                }
                return false;
            };
            // 允许打开右键菜单
            if (shouldOpenContextMenuFlag && !isEmitByNodeWrapper()) {
                var mouseEvent = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: clientX,
                    clientY: clientY,
                    screenX: screenX,
                    screenY: screenY,
                    button: button,
                    buttons: buttons
                });
                _this.$wrapper.dispatchEvent(mouseEvent);
            }
            // 单击且没有按住ctrl/meta/shift键时，清空框选框
            if (!isMultiClick) {
                _this.setState({
                    boxSelectionInfo: undefined
                });
            }
            // 拖动框选box结束时
            if (isDragBox) {
                var _b = _this.getShouldSelectedNodeList(), nodeList = _b.selectedNodeList, nativeNodeList = _b.nativeNodeList;
                if (nodeList.length === 0) { // 没有选中任何节点
                    _this.setState({
                        boxSelectionInfo: undefined
                    });
                    return;
                }
                else {
                    _this.generateBoxByRealSelectedNodeDom(nativeNodeList);
                }
                var lineList = getLinesFromNode(lines, nodeList);
                _this.setContext({ selectedData: { nodes: nodeList, lines: lineList } }, function () {
                    var onSelect = _this.props.onSelect;
                    if (onSelect) {
                        onSelect(_this.state.context.selectedData);
                    }
                });
                _this.setState({
                    boxSelectionInfo: __assign(__assign({}, _this.state.boxSelectionInfo), { status: 'none' })
                });
                return;
            }
            var _c = _this.state.context, activeLine = _c.activeLine, impactNode = _c.impactNode;
            var isLineEdit = activeLine && activeLine.type !== LineEditType.ADD;
            if (isLineEdit && impactNode && !readOnly) {
                var _d = activeLine, type = _d.type, origin_2 = _d.origin;
                if (type === LineEditType.EDIT_END) {
                    var editLine_1 = { start: origin_2.start, end: impactNode };
                    var repeatIndex_1 = _this.getLineRepeatIndex(editLine_1) || {};
                    var getNewline_1 = function (item) {
                        if (!_this.samePostionLinesLength(editLine_1)) {
                            // eslint-disable-next-line no-param-reassign
                            delete item.index;
                        }
                        return __assign(__assign(__assign({}, item), { end: impactNode }), repeatIndex_1);
                    };
                    _this.onChange(__assign(__assign({}, _this.props.data), { lines: lines.map(function (item) { return (_.isEqual(item, origin_2)
                            ? getNewline_1(item)
                            : item); }) }), ChangeType.EDIT_LINE);
                }
            }
            _this.clearMouseEventData();
        };
        _this.clearMouseEventData = function () {
            _this.dragCanvasPo = null;
            _this.setContext({ activeLine: null, linking: false, impactNode: null });
        };
        _this.handleLineDraw = function (startId) {
            var _a = _this.props, data = _a.data, lineColor = _a.lineColor;
            var lines = _this.props.data.lines;
            var impactNode = _this.state.context.impactNode;
            if (impactNode) {
                var newLine_1 = { start: startId, end: impactNode };
                var alreadyExist = lines.find(function (item) { return _.isEqual(item, newLine_1); });
                var anchor = startId.split("-")[1] || "";
                if (!alreadyExist) {
                    var colorMap = lineColor ? { color: lineColor[anchor] } : {};
                    var repeatIndex = _this.getLineRepeatIndex(newLine_1) || {};
                    _this.onChange(__assign(__assign({}, data), { lines: __spreadArray(__spreadArray([], data.lines, true), [
                            __assign(__assign(__assign({}, newLine_1), colorMap), repeatIndex)
                        ], false) }), ChangeType.ADD_LINE);
                }
            }
            _this.clearMouseEventData();
        };
        _this.handleNodeDraw = function (nodeInfoList, childPosMap) {
            var data = _this.props.data;
            var posMaps = __assign(__assign({}, nodeInfoList.reduce(function (prev, curr) {
                var _a;
                var nodeId = curr[0], position = curr[1];
                return __assign(__assign({}, prev), (_a = {}, _a[nodeId] = position, _a));
            }, {})), childPosMap);
            _this.onChange(__assign(__assign({}, data), { 
                // @ts-ignore
                nodes: data.nodes.map(function (item) { return (Object.keys(posMaps).includes(item.id) ? __assign(__assign({}, item), { position: posMaps[item.id] }) : item); }) }), ChangeType.LAYOUT);
        };
        _this.handleCanvasClick = function (e) {
            // @ts-ignore
            var className = e.target.className;
            if (typeof className === "string"
                && className.includes("topology-canvas")) {
                // 当按住cmd或者ctrl的时候，左键点击背景图层的时候，不会清楚选中的数据。
                if (e.ctrlKey || e.metaKey) {
                    return;
                }
                _this.clearSelectData();
            }
            _this.setDraggingId(null);
        };
        _this.renderNodes = function () {
            var _a = _this.props, _b = _a.data, nodes = _b.nodes, lines = _b.lines, renderTreeNode = _a.renderTreeNode, readOnly = _a.readOnly, isReduceRender = _a.isReduceRender, prevNodeStyle = _a.prevNodeStyle;
            var context = _this.state.context;
            var selectedNodes = context.selectedData.nodes || [];
            var _c = _this.state, scaleNum = _c.scaleNum, draggingId = _c.draggingId;
            if (!renderTreeNode) {
                return null;
            }
            var lineHash = lines.reduce(function (pre, cur) {
                var _a;
                var start = cur.start, end = cur.end;
                var parent = start.split("-")[0];
                return __assign(__assign({}, pre), (_a = {}, _a[parent] = true, _a[end] = true, _a));
            }, {});
            return nodes.map(function (item) { return (React.createElement(NodeWrapper, { onMouseEnter: _this.handleHoverCurrentNode, onMouseLeave: _this.clearHoverCurrentNode, key: item.id, id: "".concat(item.id), data: item, scaleNum: scaleNum, draggingId: draggingId, isSelected: _this.isSelected(item.id), combineId: item.combineId, getBoundary: _this.getBoundary, selectedNodes: selectedNodes, setDraggingId: _this.setDraggingId, isReduceRender: isReduceRender, closeBoxSelection: _this.closeBoxSelection, readOnly: readOnly, prevNodeStyle: prevNodeStyle, isolated: !lineHash[item.id], onSelect: _this.selectNode }, function (wrapperOptions) {
                /* eslint-disable */
                return renderTreeNode(item, wrapperOptions);
            })); });
        };
        _this.renderDomMap = function (props) {
            if (props === void 0) { props = _this.props; }
            var nodes = props.data.nodes, renderTreeNode = props.renderTreeNode;
            if (!renderTreeNode) {
                return;
            }
            var domMap = document.querySelector("#topology-dom-map");
            if (!domMap) {
                domMap = document.createElement("div");
                domMap.setAttribute("id", "topology-dom-map");
            }
            domMap.innerHTML = renderToStaticMarkup(React.createElement("div", null, nodes.map(function (item) { return (React.createElement("div", { key: item.id, id: "dom-map-".concat(item.id), className: "dom-map-wrapper" }, renderTreeNode(item, {
                anchorDecorator: function (_a) {
                    var anchorId = _a.anchorId;
                    return function (_item) { return (React.createElement("div", { id: "dom-map-".concat(item.id, "-").concat(anchorId), key: anchorId, className: "dom-map-wrapper" }, _item)); };
                }
            }))); })));
            document.body.appendChild(domMap);
            setTimeout(_this.cacheNodeSize, 1000);
        };
        _this.renderLines = function () {
            var _a = _this.props, _b = _a.data, lines = _b.lines, nodes = _b.nodes, startPointAnchorId = _a.startPointAnchorId, lineTextMap = _a.lineTextMap, lineOffsetY = _a.lineOffsetY, readOnly = _a.readOnly, lineTextColor = _a.lineTextColor, lineLinkageHighlight = _a.lineLinkageHighlight, lineTextDecorator = _a.lineTextDecorator, showText = _a.showText, isReduceRender = _a.isReduceRender;
            var _c = _this.state.context, activeLine = _c.activeLine, selectedData = _c.selectedData, hoverCurrentNode = _c.hoverCurrentNode;
            var nodeHash = createHashFromObjectArray(nodes, "id");
            var isEditing = function (line) {
                return activeLine &&
                    activeLine.origin &&
                    _.isEqual(line, activeLine.origin);
            };
            var isSelected = function (line) {
                return isEditing(line) || _.some(selectedData.lines, line);
            };
            // @ts-ignore
            var isHighLight = function (line) {
                if (!hoverCurrentNode || !lineLinkageHighlight)
                    return false;
                var id = hoverCurrentNode.id;
                if (line.start.split("-")[0] === id || line.end === id)
                    return true;
            };
            var getLineStartPo = function (line) {
                if (isEditing(line) &&
                    activeLine.type === LineEditType.EDIT_START) {
                    return activeLine.start;
                }
                // 这里特殊处理下，目的是保持所有锚点的起始点位置与 startPointAnchorId 锚点位置一致
                return computeAnchorPo(
                // `dom-map-${line.start}`,
                "dom-map-".concat(startPointAnchorId === undefined ? line.start : "".concat(line.start.split("-")[0], "-").concat(startPointAnchorId)), nodeHash[line.start.split("-")[0]]);
            };
            var getLineEndPo = function (line) {
                if (isEditing(line) && activeLine.type === LineEditType.EDIT_END) {
                    return activeLine.end;
                }
                return computeNodeInputPo(nodeHash[line.end]);
            };
            return (React.createElement("svg", { className: "topology-svg" },
                lines.map(function (line, index) {
                    var start = getLineStartPo(line);
                    var end = getLineEndPo(line);
                    if (!start || !end) {
                        return null;
                    }
                    var key = "".concat(line.start, "-").concat(line.end);
                    var anchorId = line.start.split("-")[1];
                    var getTextXY = function () {
                        var minX = Math.min(start.x, end.x);
                        var minY = Math.min(start.y, end.y);
                        var x = minX + Math.abs((start.x - end.x) / 2);
                        var y = minY + Math.abs((start.y - end.y) / 2);
                        return {
                            x: x,
                            y: y
                        };
                    };
                    var defaultTextEl = lineTextColor && (React.createElement("text", { x: getTextXY().x, y: getTextXY().y, key: index, style: {
                            fill: lineTextColor[anchorId]
                        } }, anchorId === startPointAnchorId && !showText(line.start.split("-")[0]) ? null : lineTextMap[anchorId]));
                    return (React.createElement(React.Fragment, null,
                        React.createElement(Line, { isReduceRender: isReduceRender, scaleNum: _this.state.scaleNum, key: key, lineOffsetY: lineOffsetY, data: line, start: start, end: end, onSelect: _this.selectLine, selected: isSelected(line), highLight: isHighLight(line), readOnly: readOnly }),
                        lineTextDecorator ? React.createElement(LineText, { data: _this.props.data, lineTextDecorator: lineTextDecorator, position: getTextXY(), line: line }) : defaultTextEl));
                }),
                activeLine && activeLine.type === LineEditType.ADD && (React.createElement(Line, __assign({}, activeLine, { scaleNum: _this.state.scaleNum })))));
        };
        // TODO：系统计算设置一个合适的 scale，使所有节点均在可视化区域内
        _this.findScale = function (clonegraph) { return __awaiter(_this, void 0, void 0, function () {
            var scaleNum, downloadScale, canvasEle, _a, minXId, maxXId, minYId, maxYId, minYIdElement, isAllView, isViw, i;
            return __generator(this, function (_b) {
                scaleNum = this.state.scaleNum;
                downloadScale = Number(scaleNum && scaleNum.toFixed(1));
                canvasEle = clonegraph.querySelector('#topology-canvas');
                canvasEle.style.transform = "scale(".concat(downloadScale, ")");
                _a = getMaxAndMinNodeId(this.props.data.nodes), minXId = _a.minXId, maxXId = _a.maxXId, minYId = _a.minYId, maxYId = _a.maxYId;
                minYIdElement = clonegraph.querySelector("#topology-node-".concat(minYId));
                minYIdElement.scrollIntoView({ block: "start" });
                isAllView = function () {
                    var minxIdView = isInViewPort(minXId, document);
                    var maxxIdView = isInViewPort(maxXId, document);
                    var minYIdView = isInViewPort(minYId, document);
                    var maxYIdView = isInViewPort(maxYId, document);
                    return minxIdView && maxxIdView && minYIdView && maxYIdView;
                };
                isViw = isAllView();
                if (isViw)
                    return [2 /*return*/, downloadScale];
                // scale 从 1 => 0.1，寻找一个能完全展示所有内容的值
                for (i = 1; i <= 10; i++) {
                    downloadScale = Number((downloadScale - 0.1).toFixed(1));
                    canvasEle.style.transform = "scale(".concat(downloadScale, ")");
                    minYIdElement.scrollIntoView({ block: "start" });
                    isViw = isAllView();
                    if (isViw || downloadScale === 0.1) {
                        break;
                    }
                }
                return [2 /*return*/, downloadScale];
            });
        }); };
        /**
         * @param scopeType 下载区域类型（整个画布数据|选中的数据）
         * @param openDownload 是否开启下载
         * @param imgName 图片名称
         * @returns
         */
        _this.downloadImg = function (scopeType, openDownload, imgName) { return __awaiter(_this, void 0, void 0, function () {
            var _a, selectedData, scaleNum, isGlobal, nodes, graphEl, imgBase64, _b, minX, maxX, minY, maxY, imgPadding, imgMinSize;
            var _this = this;
            return __generator(this, function (_c) {
                _a = this.state, selectedData = _a.context.selectedData, scaleNum = _a.scaleNum;
                isGlobal = scopeType === 'global';
                nodes = isGlobal ? this.props.data.nodes : selectedData && selectedData.nodes;
                graphEl = document.querySelector(".topology-canvas");
                imgBase64 = '';
                _b = computeMaxAndMin(nodes), minX = _b.minX, maxX = _b.maxX, minY = _b.minY, maxY = _b.maxY;
                imgPadding = isGlobal ? 50 : 0;
                imgMinSize = 200;
                return [2 /*return*/, html2canvas(graphEl, {
                        onclone: function (documentClone) {
                            // 背景色置为透明色
                            var nodeContentEls = documentClone.getElementsByClassName('topology-node-content');
                            nodeContentEls && Array.from(nodeContentEls).forEach(function (node) {
                                var childNode = node.childNodes && node.childNodes[0];
                                var grandsonChildNode = childNode && childNode.childNodes[0];
                                node.style.backgroundColor = 'transparent';
                                node.style.border = '1px solid #fff';
                                childNode.style.backgroundColor = 'white';
                                grandsonChildNode.style.boxShadow = 'none';
                            });
                            var minYId = getMaxAndMinNodeId(nodes).minYId;
                            // 定位画布中最顶层的节点，让其滚动在浏览器顶部，尽可能的多展示其它节点
                            var minYIdElement = documentClone.getElementById("topology-node-".concat(minYId));
                            minYIdElement.scrollIntoView({
                                block: "start",
                                inline: 'center'
                            });
                        },
                        backgroundColor: 'white',
                        useCORS: true,
                        scale: 1 / scaleNum,
                        x: (minX - imgPadding) * scaleNum,
                        y: (minY - imgPadding) * scaleNum,
                        width: maxX - minX + imgMinSize,
                        height: maxY - minY + imgMinSize,
                    }).then(function (canvas) {
                        imgBase64 = canvas.toDataURL('image/png');
                        // 生成图片导出
                        if (openDownload) {
                            var a = document.createElement('a');
                            a.href = imgBase64;
                            a.download = imgName || '图片';
                            a.click();
                        }
                        _this.setState({ loading: false });
                        return Promise.resolve(imgBase64);
                    })];
            });
        }); };
        /**
         * 整个画布截图
         */
        _this.getImageBase64Url = function () { return __awaiter(_this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.downloadImg('global', false)];
                    case 1:
                        url = _a.sent();
                        return [2 /*return*/, url];
                }
            });
        }); };
        /**
         * 选中数据截图
         */
        _this.getImageBase64UrlWithSelectedData = function () { return __awaiter(_this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.downloadImg('selected', false)];
                    case 1:
                        url = _a.sent();
                        return [2 /*return*/, url];
                }
            });
        }); };
        // 定位节点
        _this.locateNodeById = function (id) {
            var nodes = _this.props.data.nodes;
            var curNode = nodes && nodes.find(function (n) { return n.id === id; });
            var ele = document.getElementById("topology-node-".concat(id));
            if (ele) {
                // 如果已选中，则不做处理
                _this.selectNode(curNode, SelectMode.SINGLE);
                ele.scrollIntoView({
                    block: "center",
                    inline: 'center'
                });
            }
        };
        _this.renderToolBars = function () {
            var _a = _this.state, scaleNum = _a.scaleNum, loading = _a.loading;
            var _b = _this.props, showCenter = _b.showCenter, showLayout = _b.showLayout, showDownload = _b.showDownload, downloadImg = _b.downloadImg, customToolboxList = _b.customToolboxList;
            /* eslint-disable */
            // @ts-ignore
            var zoomPercent = "".concat(parseInt(String((scaleNum ? scaleNum : 1).toFixed(1) * 100)), "%");
            var exportStyle = loading ? {
                backgroundColor: 'rgba(0,0,0,.04)',
                cursor: 'not-allowed',
            } : {};
            return (React.createElement("div", { className: "topology-tools", "data-html2canvas-ignore": false },
                showCenter !== false && React.createElement("div", { className: "topology-tools-btn", id: "scroll-canvas-to-center", onClick: _this.props.customPostionHeight ? _this.scrollCanvasToPositionY : _this.scrollCanvasToCenter },
                    React.createElement("img", { src: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjY4NDk5IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjExMzciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNNTEzLjc5OTY0OSAyOTUuNzQyMjM4Yy0xMTguMTc2OTE5IDAtMjE0LjE1ODE3MiA5Ni4xODEyMTUtMjE0LjE1ODE3MyAyMTQuMTU4MTcyIDAgMTE4LjE3NjkxOSA5Ni4xODEyMTUgMjE0LjE1ODE3MiAyMTQuMTU4MTczIDIxNC4xNTgxNzIgMTE3Ljk3Njk1OCAwIDIxNC4xNTgxNzItOTUuNzgxMjkzIDIxNC4xNTgxNzItMjEzLjk1ODIxMXMtOTYuMTgxMjE1LTIxNC4zNTgxMzMtMjE0LjE1ODE3Mi0yMTQuMzU4MTMzeiBtMCAzNjcuMzI4MjU2Yy04NC4zODM1MTkgMC0xNTIuOTcwMTIzLTY4LjU4NjYwNC0xNTIuOTcwMTI0LTE1Mi45NzAxMjNzNjguNTg2NjA0LTE1Mi45NzAxMjMgMTUyLjk3MDEyNC0xNTIuOTcwMTIzIDE1Mi45NzAxMjMgNjguNTg2NjA0IDE1Mi45NzAxMjMgMTUyLjk3MDEyMy02OC41ODY2MDQgMTUyLjk3MDEyMy0xNTIuOTcwMTIzIDE1Mi45NzAxMjN6IiBmaWxsPSIjMzMzMzMzIiBwLWlkPSIxMTM4Ij48L3BhdGg+PHBhdGggZD0iTTk5MS4zMDYzODUgNDgwLjUwNjE1MUg5MTMuOTIxNWMtNy4xOTg1OTQtOTYuNTgxMTM2LTQ4LjE5MDU4OC0xODYuMzYzNjAxLTExNy4zNzcwNzUtMjU1LjU1MDA4OHMtMTU4Ljk2ODk1MS0xMTAuMTc4NDgxLTI1NS41NTAwODgtMTE3LjM3NzA3NVYzMC41OTQwMjVjMC0xNi43OTY3MTktMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1cy0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNCAzMC41OTQwMjV2NzYuOTg0OTYzYy05Ni4zODExNzYgNy4xOTg1OTQtMTg2LjM2MzYwMSA0OC4xOTA1ODgtMjU1LjU1MDA4OCAxMTcuMzc3MDc1UzExNC4wNzc3MTkgMzgzLjcyNTA1NCAxMDYuODc5MTI1IDQ4MC41MDYxNTFIMzAuNjk0MDA1Yy0xNi43OTY3MTkgMC0zMC41OTQwMjUgMTMuNzk3MzA1LTMwLjU5NDAyNSAzMC41OTQwMjVzMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjUgMzAuNTk0MDI0aDc2LjE4NTEyYzcuMTk4NTk0IDk2LjU4MTEzNiA0OC4xOTA1ODggMTg2LjM2MzYwMSAxMTcuMzc3MDc1IDI1NS41NTAwODhzMTU4Ljk2ODk1MSAxMTAuMTc4NDgxIDI1NS41NTAwODggMTE3LjM3NzA3NXY3OC43ODQ2MTJjMCAxNi43OTY3MTkgMTMuNzk3MzA1IDMwLjU5NDAyNSAzMC41OTQwMjQgMzAuNTk0MDI1czMwLjU5NDAyNS0xMy43OTczMDUgMzAuNTk0MDI1LTMwLjU5NDAyNXYtNzguNzg0NjEyYzk2LjM4MTE3Ni03LjE5ODU5NCAxODYuMzYzNjAxLTQ4LjE5MDU4OCAyNTUuNTUwMDg4LTExNy4zNzcwNzVzMTEwLjE3ODQ4MS0xNTguOTY4OTUxIDExNy4zNzcwNzUtMjU1LjU1MDA4OGg3Ny4zODQ4ODVjMTYuNzk2NzE5IDAgMzAuNTk0MDI1LTEzLjc5NzMwNSAzMC41OTQwMjUtMzAuNTk0MDI0IDAtMTYuOTk2NjgtMTMuNzk3MzA1LTMwLjU5NDAyNS0zMC41OTQwMjUtMzAuNTk0MDI1ek03NTMuMTUyOSA3NTMuODUyNzYzYy02NC43ODczNDYgNjQuNzg3MzQ2LTE1MS4xNzA0NzUgMTAwLjU4MDM1NS0yNDIuNzUyNTg4IDEwMC41ODAzNTYtOTEuNzgyMDc0IDAtMTc3Ljk2NTI0MS0zNS43OTMwMDktMjQyLjc1MjU4Ny0xMDAuNTgwMzU2LTY0Ljc4NzM0Ni02NC43ODczNDYtMTAwLjU4MDM1NS0xNTEuMTcwNDc1LTEwMC41ODAzNTUtMjQyLjc1MjU4N3MzNS43OTMwMDktMTc3Ljk2NTI0MSAxMDAuNTgwMzU1LTI0Mi43NTI1ODhjNjQuNzg3MzQ2LTY0Ljc4NzM0NiAxNTEuMTcwNDc1LTEwMC41ODAzNTUgMjQyLjc1MjU4Ny0xMDAuNTgwMzU1IDkxLjc4MjA3NCAwIDE3Ny45NjUyNDEgMzUuNzkzMDA5IDI0Mi43NTI1ODggMTAwLjU4MDM1NSA2NC43ODczNDYgNjQuNzg3MzQ2IDEwMC41ODAzNTUgMTUxLjE3MDQ3NSAxMDAuNTgwMzU1IDI0Mi43NTI1ODhzLTM1LjU5MzA0OCAxNzcuOTY1MjQxLTEwMC41ODAzNTUgMjQyLjc1MjU4N3oiIGZpbGw9IiMzMzMzMzMiIHAtaWQ9IjExMzkiPjwvcGF0aD48L3N2Zz4=", alt: "" }),
                    React.createElement("div", { className: "tooltip" }, "\u5B9A\u4F4D\u4E2D\u5FC3")),
                showLayout !== false && React.createElement("div", { className: "topology-tools-btn", id: "auto-layout", onClick: _this.autoLayout },
                    React.createElement("img", { src: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNTYwMzI3NjU0MDc4IiBjbGFzcz0iaWNvbiIgc3R5bGU9IiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwMjIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNODg1LjkyNzYxNyA2NzQuMzAwMTMyVjQ5Ny42NDYxMTNINTQwLjc3MTIyVjM1My44Mjk5MjRoMzQ1LjE1NzQyMVYxMjMuNjk3MDA2SDEzOC4wNzAzMzZ2MjMwLjEzMjkxOGgzNDUuMTU3NDIxdjE0My44MTYxODlIMTM4LjA3MDMzNnYxNzYuNjU0MDE5Yy00OS40Nzc3NzkgMTIuODYyOTMzLTg2LjI4ODA3NiA1Ny40OTc0MTQtODYuMjg4MDc2IDExMC45NTA3MjkgMCA2My40NTMwNDQgNTEuNTk4MDY1IDExNS4wNTIxMzMgMTE1LjA1NDE3OSAxMTUuMDUyMTMzIDYzLjQ1MjAyMSAwIDExNS4wNTAwODYtNTEuNTk5MDg5IDExNS4wNTAwODYtMTE1LjA1MjEzMyAwLTUzLjQ1MzMxNi0zNi44MTAyOTctOTguMDg3Nzk2LTg2LjI4ODA3Ni0xMTAuOTUwNzI5VjU1NS4xNDQ1NWgyODcuNjMwMzMxdjExOS4xNTQ1NTljLTQ5LjQ5MTA4MiAxMi44NjI5MzMtODYuMjg4MDc2IDU3LjQ5NzQxNC04Ni4yODgwNzYgMTEwLjk1MDcyOSAwIDYzLjQ1MzA0NCA1MS41OTkwODkgMTE1LjA1MjEzMyAxMTUuMDY2NDU5IDExNS4wNTIxMzMgNjMuNDI1NDE1IDAgMTE1LjA1NDE3OS01MS41OTkwODkgMTE1LjA1NDE3OS0xMTUuMDUyMTMzIDAtNTMuNDUzMzE2LTM2Ljc5ODAxNy05OC4wODc3OTYtODYuMjg5MDk5LTExMC45NTA3MjlWNTU1LjE0NDU1aDI4Ny42MzAzMzF2MTE5LjE1NDU1OWMtNDkuNDkzMTI5IDEyLjg2MjkzMy04Ni4yODcwNTMgNTcuNDk3NDE0LTg2LjI4NzA1MyAxMTAuOTUwNzI5IDAgNjMuNDUzMDQ0IDUxLjU2OTQxMyAxMTUuMDUyMTMzIDExNS4wNTExMSAxMTUuMDUyMTMzIDYzLjQyNDM5MSAwIDExNS4wNTMxNTYtNTEuNTk5MDg5IDExNS4wNTMxNTYtMTE1LjA1MjEzMy0wLjAwMjA0Ny01My40NTMzMTYtMzYuODAwMDY0LTk4LjA4Njc3My04Ni4yOTIxNy0xMTAuOTQ5NzA2ek0xOTUuNTk3NDI2IDE4MS4yMjQwOTZoNjMyLjgwNDEyNXYxMTUuMDUyMTMySDE5NS41OTc0MjZWMTgxLjIyNDA5NnogbTI4Ljc2NDA1NiA2MDQuMDI2NzY1YzAgMzEuNzEyMTk2LTI1LjgxNDg5NCA1Ny41NTQ3MTktNTcuNTI2MDY2IDU3LjU1NDcxOS0zMS43MTQyNDIgMC01Ny41MjcwOS0yNS44NDI1MjMtNTcuNTI3MDktNTcuNTU0NzE5IDAtMzEuNzE0MjQyIDI1LjgxMjg0Ny01Ny40OTg0MzcgNTcuNTI3MDktNTcuNDk4NDM3IDMxLjcxMjE5Ni0wLjAwMTAyMyA1Ny41MjYwNjYgMjUuNzgzMTcxIDU3LjUyNjA2NiA1Ny40OTg0Mzd6IG0zNDUuMTcxNzQ3IDBjMCAzMS43MTIxOTYtMjUuODQxNSA1Ny41NTQ3MTktNTcuNTI3MDg5IDU3LjU1NDcxOS0zMS43MjQ0NzUgMC01Ny41MzkzNjktMjUuODQyNTIzLTU3LjUzOTM2OS01Ny41NTQ3MTkgMC0zMS43MTQyNDIgMjUuODE1OTE3LTU3LjQ5ODQzNyA1Ny41MzkzNjktNTcuNDk4NDM3IDMxLjY4NTU5LTAuMDAxMDIzIDU3LjUyNzA5IDI1Ljc4MzE3MSA1Ny41MjcwODkgNTcuNDk4NDM3eiBtMjg3LjYzMTM1NSA1Ny41NTQ3MTljLTMxLjc0MTg3MiAwLTU3LjUyODExMy0yNS44NDI1MjMtNTcuNTI4MTEzLTU3LjU1NDcxOSAwLTMxLjcxNDI0MiAyNS43ODYyNDEtNTcuNDk4NDM3IDU3LjUyODExMy01Ny40OTg0MzcgMzEuNjg1NTkgMCA1Ny41MjcwOSAyNS43ODQxOTUgNTcuNTI3MDkgNTcuNDk4NDM3IDAgMzEuNzEyMTk2LTI1Ljg0MTUgNTcuNTU0NzE5LTU3LjUyNzA5IDU3LjU1NDcxOXoiIGZpbGw9IiMyYzJjMmMiIHAtaWQ9IjEwMjMiPjwvcGF0aD48L3N2Zz4=", alt: "" }),
                    React.createElement("div", { className: "tooltip" }, "\u81EA\u52A8\u5E03\u5C40")),
                showDownload && React.createElement("div", { className: "topology-tools-btn", id: "export-img", style: exportStyle, onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            if (loading)
                                return [2 /*return*/];
                            // 截图之前需要重置 scaleNum 为 1，避免坐标错位
                            this.setState({
                                scaleNum: 1,
                                loading: true,
                            }, function () {
                                downloadImg ? downloadImg() : _this.downloadImg('global', true);
                            });
                            return [2 /*return*/];
                        });
                    }); } },
                    React.createElement("img", { alt: '', src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiM2MTYxNjEiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxwYXRoIGQ9Ik01MTIgNjJsNS42LjRDNTM5LjggNjUuMSA1NTcgODQuMSA1NTcgMTA3YzAgMjQuOS0yMC4xIDQ1LTQ1IDQ1SDE3NC41bC00LjUuNWMtMTAuMyAyLjEtMTggMTEuMi0xOCAyMnY0OTcuOWwxNzIuOC0xNTguM2MyNy41LTI1LjIgNjguNy0yNy41IDk4LjYtNi4zbDUuOCA0LjUgMTUxLjkgMTMwLjIgMTA0LjQtMTA0LjNjMjYtMjYgNjYuMi0zMC4zIDk2LjktMTEuNGw2IDQuMSA4My41IDYyLjZWNTEyaDkwdjMzNy41bC0uMyA4LjRDOTU3LjQgOTE2LjEgOTA4LjggOTYyIDg0OS41IDk2MmgtNjc1bC04LjQtLjNDMTA3LjkgOTU3LjQgNjIgOTA4LjggNjIgODQ5LjV2LTY3NWwuMy04LjRDNjYuNiAxMDcuOSAxMTUuMiA2MiAxNzQuNSA2Mkg1MTJ6TTM3My4xIDU2MmwtMi43IDEuOUwxNTIgNzY0djg1LjVsLjUgNC41YzIuMSAxMC4zIDExLjIgMTggMjIgMThoNjc1YzEyLjQgMCAyMi41LTEwLjEgMjIuNS0yMi41VjY3Ny45bC0xMjQtOTNjLTMuNi0yLjctOC4zLTIuOS0xMi4xLS45bC0yLjYgMi0xMDAuNyAxMDAuNiA4MS40IDY5LjhjMTQuMiAxMi4xIDE1LjggMzMuNCAzLjcgNDcuNi0xMSAxMi45LTI5LjYgMTUuNC00My42IDYuNmwtNC0zLTI4NC43LTI0NGMtMy41LTMtOC4zLTMuNS0xMi4zLTEuNnpNOTE3IDQ2N2MyNC45IDAgNDUgMjAuMSA0NSA0NWgtOTBjMC0yNC45IDIwLjEtNDUgNDUtNDV6TTgwNC41IDczLjJjMTcuMSAwIDMxLjIgMTIuNyAzMy40IDI5LjJsLjMgNC42djE4OC41bDU0LjktNTQuOWMxMi0xMiAzMC43LTEzLjEgNDMuOS0zLjNsMy44IDMuM2MxMiAxMiAxMy4xIDMwLjcgMy4zIDQzLjlsLTMuMyAzLjgtMTEyLjQgMTEyLjYtMS44IDEuNi0uMy4yLS43LjctLjMuMi0uNS41LjQtLjQtMi42IDEuOWMtLjkuNi0xLjkgMS4xLTIuOSAxLjYtLjMuMS0uNi4zLS44LjQtMS4zLjYtMi42IDEuMS00IDEuNS0uNi4yLTEuMS4zLTEuNi41LTEuMS4zLTIuMy42LTMuNS43bC0uOS4xYy0xLjQuMi0yLjguMy00LjIuM2wtMi4zLS4xYy0yLjgtLjItNS42LS43LTguMi0xLjYtMS0uMy0xLjctLjYtMi4zLS45LTIuNS0xLTQuOS0yLjQtNy4yLTQuMS0uNy0uNS0xLjMtMS0xLjgtMS40bC0yLTEuOC0xMTIuOC0xMTIuNGMtMTMuMi0xMy4yLTEzLjItMzQuNSAwLTQ3LjcgMTItMTIgMzAuNy0xMy4xIDQzLjktMy4zbDMuOCAzLjMgNTQuOSA1NC45VjEwNy4xYy4xLTE4LjcgMTUuMi0zMy45IDMzLjgtMzMuOXoiLz48L3N2Zz4=' }),
                    React.createElement("div", { className: "tooltip" }, loading ? '导出中...' : '导出图片')),
                Array.isArray(customToolboxList) &&
                    customToolboxList.map(function (_a) {
                        var _b = _a.wrapperProps, wrapperProps = _b === void 0 ? {} : _b, content = _a.content, tooltip = _a.tooltip;
                        return (React.createElement("div", __assign({ className: "topology-tools-btn" }, wrapperProps),
                            content,
                            React.createElement("div", { className: "tooltip" }, tooltip)));
                    }),
                React.createElement("div", { className: "topology-tools-zoom", onClick: _this.zoomIn },
                    React.createElement("img", { src: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjIxOTIzNzE5OTI0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwOTIwIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PC9zdHlsZT48L2RlZnM+PHBhdGggZD0iTTUxMi42MTY5NDIgNjQuMTg2NjczYzYxLjcyMDU1MyAwIDExOS43OTA3ODIgMTEuNzc5ODEzIDE3NC4yMTEwODUgMzUuMzM5NDRzMTAxLjcwNjA0MyA1NS40MTU0MjggMTQxLjg1NzQyMSA5NS41Njc0MDVjNDAuMTUxMzc3IDQwLjE1MTk3NyA3Mi4wMDcxNzkgODcuMjcxODMgOTUuNTY3NDA1IDE0MS4zNTk3NTggMjMuNTYwMjI2IDU0LjA4NzcyOSAzNS4zNDAwMzkgMTExLjk5MjI2OSAzNS4zMzk0NCAxNzMuNzEzNDIyLTAuMDAwNiA2MS43MjA5NTMtMTEuNzgwMjEzIDExOS43OTEzODEtMzUuMzM5NDQgMTc0LjIxMTA4NS0yMy41NTkwMjcgNTQuNDE5NzAzLTU1LjQxNTAyOSAxMDEuNzA1NDQ0LTk1LjU2NzQwNSAxNDEuODU3NDIxLTQwLjE1MjU3NyA0MC4xNTE5NzctODcuNDM4MzE3IDcyLjAwNzc3OS0xNDEuODU3NDIxIDk1LjU2NzQwNS01NC40MTkxMDQgMjMuNTU5NjI3LTExMi40ODkzMzIgMzUuMzM5NDQtMTc0LjIxMTA4NSAzNS4zMzk0NHMtMTE5LjYyNjA5NC0xMS43Nzk4MTMtMTczLjcxMzQyMi0zNS4zMzk0NGMtNTQuMDg3MzI5LTIzLjU1OTYyNy0xMDEuMjA3MTgyLTU1LjQxNTQyOC0xNDEuMzU5NzU4LTk1LjU2NzQwNS00MC4xNTI1NzctNDAuMTUxOTc3LTcyLjAwODM3OC04Ny40Mzc3MTctOTUuNTY3NDA1LTE0MS44NTc0MjFzLTM1LjMzODg0LTExMi40ODk5MzItMzUuMzM5NDQtMTc0LjIxMTA4NWMtMC4wMDA2LTYxLjcyMTE1MyAxMS43NzkyMTQtMTE5LjYyNTQ5NCAzNS4zMzk0NC0xNzMuNzEzNDIyczU1LjQxNjAyOC0xMDEuMjA3NzgxIDk1LjU2NzQwNS0xNDEuMzU5NzU4IDg3LjI3MTIzLTcyLjAwNzc3OSAxNDEuMzU5NzU4LTk1LjU2NzQwNVM0NTAuODk2NTg4IDY0LjE4Njg3MyA1MTIuNjE2OTQyIDY0LjE4NjY3M3pNNzM0LjYxMDgzIDU3MC44OTEzMjhjMTkuOTA5NzAxIDAgMzcuODI4NTUyLTUuMTQzMzEzIDUzLjc1NjE1My0xNS40Mjk5MzkgMTUuOTI3NjAxLTEwLjI4NjYyNiAyMy44OTE0MDItMjUuNzE2NTY0IDIzLjg5MTQwMi00Ni4yODk4MTYgMC0xOS45MDk3MDEtNy45NjM4MDEtMzQuNjc2Mjg5LTIzLjg5MTQwMi00NC4yOTkzNjUtMTUuOTI3NjAxLTkuNjIzMDc2LTMzLjg0NjI1Mi0xNC40MzQ2MTMtNTMuNzU2MTUzLTE0LjQzNDgxM0wyOTQuNjA0MTU0IDQ1MC40MzczOTVjLTE5LjkwOTcwMSAwLTM4LjE2MDUyNyA0LjgxMTUzOC01NC43NTIyNzggMTQuNDM0ODEzLTE2LjU5MTc1MSA5LjYyMzA3Ni0yNC44ODc1MjYgMjQuMzg5NjY0LTI0Ljg4NzUyNiA0NC4yOTkzNjUgMCAyMC41NzMyNTEgOC4yOTU3NzUgMzYuMDAzMTkgMjQuODg3NTI2IDQ2LjI4OTgxNiAxNi41OTE3NTEgMTAuMjg2NjI2IDM0Ljg0MjM3NyAxNS40Mjk5MzkgNTQuNzUyMjc4IDE1LjQyOTkzOUw3MzQuNjEwODMgNTcwLjg5MTMyOCA3MzQuNjEwODMgNTcwLjg5MTMyOHoiIHAtaWQ9IjEwOTIxIiBmaWxsPSIjOUZBMkE4Ij48L3BhdGg+PC9zdmc+", alt: "" })),
                React.createElement("div", { className: "topology-tools-percent" }, zoomPercent),
                React.createElement("div", { className: "topology-tools-zoom", onClick: _this.zoomOut },
                    React.createElement("img", { src: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjIxOTIzNDA4MzQyIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjgwNSIgZGF0YS1zcG0tYW5jaG9yLWlkPSJhMzEzeC43NzgxMDY5LjAuaTIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNNTE3LjEyIDQzLjkxOTM2Yy0yNTguNzM0MDggMC00NjguNDggMjA5Ljc0NTkyLTQ2OC40OCA0NjguNDhzMjA5Ljc0NTkyIDQ2OC40OCA0NjguNDggNDY4LjQ4IDQ2OC40OC0yMDkuNzQ1OTIgNDY4LjQ4LTQ2OC40OC0yMDkuNzQ1OTItNDY4LjQ4LTQ2OC40OC00NjguNDh6TTc0Mi4yMzg3MiA1NjUuNzZINTcwLjg4djE3MS43OTkwNGMwIDI5LjU2OC0yNC4xOTIgNTMuNzYtNTMuNzYgNTMuNzZzLTUzLjc2LTI0LjE5Mi01My43Ni01My43NlY1NjUuNzZoLTE3MS40MzgwOGMtMjkuNTY4IDAtNTMuNzYtMjQuMTkyLTUzLjc2LTUzLjc2czI0LjE5Mi01My43NiA1My43Ni01My43Nkg0NjMuMzZ2LTE3MC45OTc3NmMwLTI5LjU2OCAyNC4xOTItNTMuNzYgNTMuNzYtNTMuNzZzNTMuNzYgMjQuMTkyIDUzLjc2IDUzLjc2VjQ1OC4yNGgxNzEuMzU4NzJjMjkuNTY4IDAgNTMuNzYgMjQuMTkyIDUzLjc2IDUzLjc2cy0yNC4xOTIgNTMuNzYtNTMuNzYgNTMuNzZ6IiBwLWlkPSI4MDYiIGZpbGw9IiM5RkEyQTgiPjwvcGF0aD48L3N2Zz4=", alt: "" }))));
        };
        _this.handleSelectAll = function () {
            var _a = _this.props, data = _a.data, onSelect = _a.onSelect;
            _this.setContext({
                selectedData: data
            }, function () {
                if (onSelect) {
                    onSelect(_this.state.context.selectedData);
                }
            });
        };
        _this.handleDeselectAll = function () {
            var onSelect = _this.props.onSelect;
            _this.setContext({
                selectedData: { nodes: [], lines: [] }
            }, function () {
                if (onSelect) {
                    onSelect(_this.state.context.selectedData);
                }
            });
        };
        /**
         * Check whether the drag node overlaps
         * @param nodeInfo [string, IPosition][]
         * @returns
         */
        _this.validateIsOverlap = function (nodeInfo) {
            var _a = _this.props, nodes = _a.data.nodes, overlap = _a.overlap, _b = _a.overlapOffset, overlapOffset = _b === void 0 ? {} : _b;
            if (!overlap)
                return false;
            var nodePosMap = new Map();
            nodeInfo.forEach(function (_a) {
                var id = _a[0], pos = _a[1];
                nodePosMap.set(id, pos);
            });
            var getNodeOffsetPos = function (position, id) {
                return {
                    x: position.x + getNodeSize(id).width + overlapOffset.offsetX || 0,
                    y: position.y + getNodeSize(id).height + overlapOffset.offsetY || 0,
                };
            };
            var posMap = nodes && nodes.filter(function (n) { return !nodePosMap.has(n.id) && !n.filterOverlap; }).map(function (n) {
                // const pos = nodePosMap.get(n.id);
                return {
                    T1: {
                        x: n.position.x,
                        y: n.position.y,
                    },
                    T2: getNodeOffsetPos(n.position, n.id)
                };
            });
            var isOverlap = Array.from(nodePosMap).some(function (_a) {
                var id = _a[0], pos = _a[1];
                var S1 = {
                    x: pos.x,
                    y: pos.y
                };
                var S2 = getNodeOffsetPos(pos, id);
                return posMap.some(function (p) { return !(S2.y < p.T1.y || S1.y > p.T2.y || S2.x < p.T1.x || S1.x > p.T2.x) === true; });
            });
            return isOverlap;
        };
        _this.multiValidateIsOverlap = function (drawId, pos) {
            return false;
        };
        _this.setRealDragNodeDomList = function (element) {
            _this.setState({
                realDragNodeDomList: element
            });
        };
        _this.setAlignmentLines = function (alignmentLines) {
            _this.setState({
                alignmentLines: alignmentLines,
            });
        };
        // 获取 drag 时节点坐标
        _this.getNodePosition = function (monitor, nodeDom, isChild) {
            if (!monitor)
                return {};
            var scaleNum = _this.state.scaleNum;
            var clientOffset = monitor.getDifferenceFromInitialOffset() || {};
            var nodePosition = {
                top: nodeDom.style.top,
                left: nodeDom.style.left
            };
            var scalePosition = {
                x: Number(nodePosition.left.replace(/[px]+/g, "")) +
                    clientOffset.x / scaleNum || 0,
                y: Number(nodePosition.top.replace(/[px]+/g, "")) +
                    clientOffset.y / scaleNum || 0
            };
            var scrollPosition = computeCanvasPo(monitor.getSourceClientOffset() || {}, _this.$wrapper);
            /**
             * TODO： scaleNum 缩放与窗口滚动时有冲突, isChild 为子节点联动时使用 scalePosition 定位
             */
            var position = scaleNum === 1 ? (isChild ? scalePosition : scrollPosition) : scalePosition;
            return position;
        };
        _this.shouldAutoLayout = shouldAutoLayout(props.data.nodes);
        return _this;
    }
    Topology.prototype.componentWillMount = function () {
        this.renderDomMap();
        var autoClearSelectedFn = this.getAutoClearSelectedFn();
        if (autoClearSelectedFn) {
            document.body.removeEventListener('click', autoClearSelectedFn);
        }
    };
    Topology.prototype.componentDidMount = function () {
        var _this = this;
        var _a = this.props, getInstance = _a.getInstance, readOnly = _a.readOnly, customPostionHeight = _a.customPostionHeight, scaleNum = _a.scaleNum;
        this.editLine = _.throttle(this.editLine, 40);
        if (!readOnly) {
            this.initDomEvents();
        }
        if (this.$wrapper) {
            // 自定义节点距离画布顶部高度
            if (customPostionHeight) {
                this.scrollCanvasToPositionY();
            }
            else {
                this.scrollCanvasToCenter();
            }
            var autoClearSelectedFn = this.getAutoClearSelectedFn();
            if (autoClearSelectedFn) {
                document.body.addEventListener('click', autoClearSelectedFn);
            }
        }
        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout();
        }
        if (getInstance) {
            getInstance(this);
        }
        this.setState(function () {
            _this.scaleNum = scaleNum === undefined ? 1 : scaleNum;
            // 记录默认缩放的值，resetScale 时候用
            _this.defaultScaleNum = _this.scaleNum;
            return { scaleNum: scaleNum };
        });
    };
    Topology.prototype.getAutoClearSelectedFn = function () {
        // eslint-disable-next-line react/destructuring-assignment
        if (!this.props.autoRemoveSelected) {
            return undefined;
        }
        // eslint-disable-next-line react/destructuring-assignment
        return typeof this.props.autoRemoveSelected === 'function' ? this.props.autoRemoveSelected : this.clearSelectedWhenClickOutside;
    };
    Topology.prototype.componentWillReceiveProps = function (nextProps) {
        var readOnly = this.props.readOnly;
        var nextReadOnly = nextProps.readOnly;
        this.renderDomMap(nextProps);
        this.shouldAutoLayout = shouldAutoLayout(nextProps.data.nodes);
        if (readOnly && !nextReadOnly) {
            this.initDomEvents();
        }
        if (!readOnly && nextReadOnly) {
            this.removeDomEvents();
        }
    };
    Topology.prototype.componentDidUpdate = function () {
        if (this.shouldAutoLayout) {
            this.shouldAutoLayout = false;
            this.autoLayout();
        }
    };
    Topology.prototype.componentWillUnmount = function () {
        // @ts-ignore
        if (typeof this.editLine.cancel === "function") {
            // @ts-ignore
            this.editLine.cancel();
        }
        this.removeDomEvents();
    };
    Topology.prototype.render = function () {
        var _this = this;
        var _a = this.props, connectDropTarget = _a.connectDropTarget, showBar = _a.showBar, snapline = _a.snapline;
        var _b = this.state, context = _b.context, scaleNum = _b.scaleNum, boxSelectionInfo = _b.boxSelectionInfo, alignmentLines = _b.alignmentLines;
        var xPos = boxSelectionInfo ? "".concat(boxSelectionInfo.x, ",").concat(boxSelectionInfo.initX) : '';
        var yPos = boxSelectionInfo ? "".concat(boxSelectionInfo.y, ",").concat(boxSelectionInfo.initY) : '';
        return connectDropTarget(React.createElement("div", { className: "byai-topology", ref: function (r) {
                _this.$topology = r;
            } },
            React.createElement("div", { ref: function (r) {
                    _this.$wrapper = r;
                }, className: classnames({
                    "topology-wrapper": true,
                    "topology-linking": context.linking,
                }), onContextMenu: function (e) {
                    if (e.isTrusted) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }, onMouseDown: this.handleMouseDown, onMouseMove: this.handleMouseMove, onMouseUp: this.handleMouseUp, onMouseLeave: this.clearMouseEventData },
                React.createElement("div", { ref: function (r) {
                        _this.$canvas = r;
                    }, id: 'topology-canvas', className: "topology-canvas topology-zoom", 
                    // @ts-ignore
                    style: {
                        width: config.canvas.width,
                        height: config.canvas.height,
                        // @ts-ignore
                        "--scaleNum": scaleNum
                    }, onClick: this.handleCanvasClick },
                    React.createElement(Provider, { value: context },
                        this.renderNodes(),
                        this.renderLines(),
                        React.createElement(Selection, { onClick: function (e) {
                                e.stopPropagation();
                                _this.setState({
                                    boxSelectionInfo: null
                                });
                            }, renderTool: typeof this.props.renderBoxSelectionTool === 'function' ? this.props.renderBoxSelectionTool : undefined, toolVisible: this.state.boxSelectionInfo && this.state.boxSelectionInfo.status === 'static', xPos: xPos, yPos: yPos, wrapper: this.$wrapper, visible: !!boxSelectionInfo }),
                        snapline !== false && React.createElement(SnapLine, { alignmentLines: alignmentLines })))),
            showBar !== false && this.renderToolBars()));
    };
    return Topology;
}(React.Component));
function hover(props, monitor, component) {
    var _a;
    if (!monitor.getItem()) {
        return;
    }
    var context = component.state.context;
    var clientOffset = monitor.getClientOffset();
    var id = monitor.getItem().id;
    var type = monitor.getItemType();
    switch (type) {
        case NodeTypes.ANCHOR:
            if (clientOffset) {
                var nodeId_1 = id.split('-')[0];
                var parentNode = props.data.nodes.find(function (item) { return item.id === nodeId_1; });
                var hasAnchorExistLine = !props.canConnectMultiLines && props.data.lines.find(function (item) { return item.start === id; });
                if (hasAnchorExistLine || !parentNode || !component.$wrapper) {
                    return;
                }
                var startPo = context.activeLine ? context.activeLine.start : computeAnchorPo("dom-map-".concat(id), parentNode);
                var endPo = computeCanvasPo(clientOffset, component.$wrapper);
                if (!startPo || !endPo) {
                    return;
                }
                var impactNode = component.impactCheck(endPo, startPo, id);
                component.setContext({
                    impactNode: impactNode,
                    linking: true,
                    activeLine: {
                        type: LineEditType.ADD,
                        origin: null,
                        start: startPo,
                        end: endPo
                    }
                });
            }
            break;
        case NodeTypes.TEMPLATE_NODE:
        case NodeTypes.NORMAL_NODE: {
            var nodes = props.data.nodes;
            var nodeDom = document.getElementById("topology-node-".concat(id));
            var ALIGNMENT_THRESHOLD_1 = 2;
            // 计算两个节点之间的距离
            var getDistance_1 = function (node1, node2) {
                var dx = Math.abs(node1.position.x - node2.position.x);
                var dy = Math.abs(node1.position.y - node2.position.y);
                return { dx: dx, dy: dy };
            };
            // 根据两个节点之间的距离信息，判断它们是否在水平或垂直方向上对齐
            var getAlignment_1 = function (node1, node2) {
                var distance = getDistance_1(node1, node2);
                if (distance.dx < ALIGNMENT_THRESHOLD_1) {
                    return { vertical: true, x: node2.position.x };
                }
                if (distance.dy < ALIGNMENT_THRESHOLD_1) {
                    return { horizontal: true, y: node2.position.y };
                }
                return null;
            };
            var position = type === NodeTypes.TEMPLATE_NODE ? computeCanvasPo(monitor.getSourceClientOffset(), component.$wrapper) : component.getNodePosition(monitor, nodeDom);
            var draggedNode_1 = {
                id: id,
                position: position
            };
            // 计算所有节点之间的对齐关系，并更新对齐线的位置信息
            var newAlignmentLines_1 = {};
            // 过滤掉当前拖动的节点
            (_a = nodes === null || nodes === void 0 ? void 0 : nodes.filter(function (n) { return n.id !== id; })) === null || _a === void 0 ? void 0 : _a.forEach(function (node) {
                var alignment = getAlignment_1(draggedNode_1, node);
                if (alignment) {
                    // 过滤掉因为设置了 ALIGNMENT_THRESHOLD，而重复的辅助线
                    if (alignment.vertical && !Object.keys(newAlignmentLines_1).some(function (key) { return key.includes("line-vertical"); })) {
                        // 垂直线
                        newAlignmentLines_1["line-vertical-".concat(node.id)] = {
                            left: alignment.x,
                            top: 0,
                            height: "100%"
                        };
                    }
                    // 水平线
                    if (alignment.horizontal && !Object.keys(newAlignmentLines_1).some(function (key) { return key.includes("line-horizontal"); })) {
                        newAlignmentLines_1["line-horizontal-".concat(node.id)] = {
                            left: 0,
                            top: alignment.y,
                            width: "100%"
                        };
                    }
                }
            });
            component.setAlignmentLines(newAlignmentLines_1);
            component.setContext({
                dragging: true,
            });
            break;
        }
        default:
            break;
    }
}
export default DropTarget([NodeTypes.NORMAL_NODE, NodeTypes.TEMPLATE_NODE, NodeTypes.ANCHOR], {
    canDrop: function (props) {
        return !props.readOnly;
    },
    hover: _.throttle(hover, 40),
    drop: function (props, monitor, component) {
        if (monitor.didDrop() || !component.$wrapper) {
            return;
        }
        var item = monitor.getItem();
        var type = monitor.getItemType();
        var clientOffset = monitor.getDifferenceFromInitialOffset();
        if (!clientOffset) {
            return;
        }
        /**
         * Get the mapping relationship between the id and position of all child nodes of the current dragging node
         * @returns
         */
        var getChildPosMap = function (idList) {
            var _a = props.data, lines = _a.lines, nodes = _a.nodes;
            var curNodeList = nodes.filter(function (n) { return idList.indexOf(n.id) > -1; });
            var childPosMap = {};
            curNodeList.forEach(function (curNode) {
                var dragChild = curNode.dragChild || isMatchKeyValue(curNode, 'dragChild', true);
                if (!dragChild)
                    return null;
                var childIds = lines.filter(function (n) { return n.start.split('-')[0] === curNode.id; }).map(function (n) { return n.end; });
                for (var _i = 0, childIds_1 = childIds; _i < childIds_1.length; _i++) {
                    var childId = childIds_1[_i];
                    var childNodeDom = document.getElementById("topology-node-".concat(childId));
                    if (!childNodeDom)
                        return null;
                    childPosMap[childId] = component.getNodePosition(monitor, childNodeDom, true);
                }
            });
            return childPosMap;
        };
        var position;
        var nodeDom = document.getElementById("topology-node-".concat(item.id));
        if (nodeDom) {
            position = component.getNodePosition(monitor, nodeDom);
        }
        else {
            position = computeCanvasPo(monitor.getSourceClientOffset(), component.$wrapper);
        }
        var nodeProps = [[item.id || item && item.data && item.data.id, position]];
        var isOverlap = function (nodeInfo) {
            return component.validateIsOverlap(nodeInfo);
        };
        switch (type) {
            case NodeTypes.TEMPLATE_NODE:
                if (!item.data) {
                    return;
                }
                var isMultiInfo = item.data.nodes && Array.isArray(item.data.nodes) && item.data.lines && Array.isArray(item.data.lines);
                /**
                 * TODO：Here first render the newly added node, if it overlaps, delete the node
                 * The main reason is that there is currently no good unified method to get the default width and height of the newly added nodes in the upper layer.
                 */
                if (isMultiInfo) {
                    nodeProps = [];
                    var minX = Math.min.apply(Math, item.data.nodes.map(function (n) { return n.position.x; }));
                    var minY = Math.min.apply(Math, item.data.nodes.map(function (n) { return n.position.y; }));
                    var offset_1 = {
                        x: position.x - minX,
                        y: position.y - minY
                    };
                    var selectedPositionList_1 = [];
                    item.data.nodes.forEach(function (n) {
                        var newPosition = {
                            x: n.position.x + offset_1.x,
                            y: n.position.y + offset_1.y
                        };
                        selectedPositionList_1.push([n.id, newPosition]);
                    });
                    nodeProps = __spreadArray(__spreadArray([], selectedPositionList_1, true), nodeProps, true);
                    var positionMap_1 = new Map(nodeProps);
                    component.onChange(__assign(__assign({}, props.data), { nodes: __spreadArray(__spreadArray([], props.data.nodes, true), item.data.nodes.map(function (n) {
                            var newPosition = positionMap_1.get(n.id);
                            var p = newPosition ? newPosition : n.position;
                            return __assign(__assign({}, n), { position: p });
                        }), true), lines: __spreadArray(__spreadArray([], props.data.lines, true), item.data.lines, true) }), ChangeType.ADD_NODE);
                }
                else {
                    component.onChange(__assign(__assign({}, props.data), { nodes: __spreadArray(__spreadArray([], props.data.nodes, true), [__assign(__assign({}, item.data), { position: position })], false) }), ChangeType.ADD_NODE);
                }
                if (isOverlap(nodeProps)) {
                    component.onChange(__assign(__assign({}, props.data), { nodes: __spreadArray([], props.data.nodes, true), lines: __spreadArray([], props.data.lines, true) }), ChangeType.ADD_NODE);
                    props.overlapCallback && props.overlapCallback();
                }
                ;
                component.setAlignmentLines({});
                component.setContext({
                    dragging: false,
                });
                break;
            case NodeTypes.NORMAL_NODE:
                var targetNodeInfo = props.data.nodes.find(function (node) {
                    return node.id === item.id;
                });
                var targetPosition = targetNodeInfo ? targetNodeInfo.position : null;
                if (targetPosition) {
                    var offset_2 = {
                        x: position.x - targetPosition.x,
                        y: position.y - targetPosition.y
                    };
                    var selectedIdSet_1 = new Set(component.state.context.selectedData.nodes.map(function (n) { return n.id; }));
                    var selectedPositionList_2 = [];
                    props.data.nodes.forEach(function (n) {
                        if (selectedIdSet_1.has(n.id)) {
                            var newPosition = {
                                x: n.position.x + offset_2.x,
                                y: n.position.y + offset_2.y
                            };
                            selectedPositionList_2.push([n.id, newPosition]);
                        }
                    });
                    nodeProps = __spreadArray(__spreadArray([], selectedPositionList_2, true), nodeProps, true);
                }
                if (isOverlap(nodeProps)) {
                    props.overlapCallback && props.overlapCallback();
                    component.showBoxSelection();
                    return;
                }
                ;
                component.handleNodeDraw(nodeProps, getChildPosMap(nodeProps.map(function (n) { return n[0]; })));
                component.setAlignmentLines({});
                component.setContext({
                    dragging: false,
                });
                // 存在移动动画时间
                setTimeout(function () {
                    component.showBoxSelection();
                }, 210);
                break;
            case NodeTypes.ANCHOR:
                component.handleLineDraw(item.id);
                break;
            default:
                break;
        }
    },
}, function (connect) { return ({ connectDropTarget: connect.dropTarget() }); })(Topology);
//# sourceMappingURL=index.js.map