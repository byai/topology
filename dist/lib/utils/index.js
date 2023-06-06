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
export var shouldAutoLayout = function (nodes) {
    if (nodes.length === 0) {
        return false;
    }
    return !nodes.find(function (item) { return !!item.position; });
};
var computeCanvasPoHelper = function ($wrapper) {
    // 当窗口有滚动时，需加上窗口的滚动
    var rect = $wrapper.getBoundingClientRect();
    // 缩放的容器
    var canvas = document.querySelector('.topology-canvas');
    // 可以获取到 svg 的宽高
    var _a = canvas.getBoundingClientRect(), width = _a.width, height = _a.height;
    // eslint-disable-next-line radix
    var zoom = parseInt(document.querySelector('.topology-tools-percent').innerHTML) / 100;
    // 缩放后画布的中心点,还是需要用缩放前的比例计算中心点
    var centerX = width / zoom / 2;
    var centerY = height / zoom / 2;
    return {
        centerX: centerX,
        centerY: centerY,
        rect: rect,
        zoom: zoom,
        scrollLeft: $wrapper.scrollLeft,
        scrollTop: $wrapper.scrollTop
    };
};
/**
 * 获取相对画布的坐标
 * TODO: 缩放 scale 之后 position 计算有问题，暂时没有想到可以绕过去的方法
 * https://github.com/react-dnd/react-dnd/issues/1730
 * fix：核心逻辑，缩放后以 1 的比例去思考
 * 计算公式：找到中心点的位置 +（鼠标位置 - 中心点的距离) / 缩放）+（一些 dom 的偏离）/ 缩放
 */
export var computeCanvasPo = function (position, $wrapper) {
    var _a = computeCanvasPoHelper($wrapper), centerX = _a.centerX, centerY = _a.centerY, rect = _a.rect, zoom = _a.zoom, scrollLeft = _a.scrollLeft, scrollTop = _a.scrollTop;
    var po = {
        x: centerX + (position.x - centerX) / zoom + (scrollLeft + window.pageXOffset - rect.left) / zoom,
        y: centerY + (position.y - centerY) / zoom + (scrollTop + window.pageYOffset - rect.top) / zoom,
    };
    return po;
};
export var multiComputeCanvasPo = function (positionList, $wrapper) {
    var _a = computeCanvasPoHelper($wrapper), centerX = _a.centerX, centerY = _a.centerY, rect = _a.rect, zoom = _a.zoom, scrollLeft = _a.scrollLeft, scrollTop = _a.scrollTop;
    return positionList.map(function (position) {
        var po = {
            x: centerX + (position.x - centerX) / zoom + (scrollLeft + window.pageXOffset - rect.left) / zoom,
            y: centerY + (position.y - centerY) / zoom + (scrollTop + window.pageYOffset - rect.top) / zoom,
        };
        return po;
    });
};
/** 计算连接线路径 */
export var computeLinePath = function (start, end, lineOffsetY) {
    if (lineOffsetY === void 0) { lineOffsetY = 0; }
    // const svgPath = path();
    // // 直线绘制方式（代码暂时保留）
    // const distance = Math.abs(start.y - end.y) * 0.5 + start.y;
    // const polyLineY = end.y - start.y < 0 ? end.y - 40 : distance;
    // const verticalPolyPoint = {
    //     x: start.x,
    //     y: polyLineY,
    // };
    // const horizontalPolyPoint = {
    //     x: end.x,
    //     y: polyLineY,
    // };
    // // A collection of points for drawing a line
    // const linePoints = [
    //     [{ ...start, y: end.y - start.y < 0 ? start.y - 20 : start.y }, verticalPolyPoint],
    //     [verticalPolyPoint, horizontalPolyPoint],
    //     [horizontalPolyPoint, end],
    // ];
    // // eslint-disable-next-line
    // for (let [startPoint, endPoint] of linePoints) {
    //     svgPath.moveTo(startPoint.x, startPoint.y);
    //     svgPath.lineTo(endPoint.x, endPoint.y);
    // }
    // 弧线绘制方式
    var x = Math.abs(start.x - end.x);
    var y = Math.abs(start.y - end.y);
    if (x === 0 || y === 0) {
        return "\n            M ".concat(start.x, " ").concat(start.y, "\n            L ").concat(end.x, " ").concat(end.y, "\n        ");
    }
    var dir;
    var p1;
    var p2;
    if (end.y < start.y) {
        var offsetY = 80;
        var offsetX = 40;
        dir = end.x - start.x > 0 ? 1 : -1;
        p1 = "".concat(start.x + dir * offsetX, ", ").concat(start.y + offsetY);
        p2 = "".concat(end.x - dir * offsetX, ", ").concat(end.y - offsetY);
        return "\n            M ".concat(start.x, " ").concat(start.y - lineOffsetY, "\n            C ").concat(p1, " ").concat(p2, " ").concat(end.x, " ").concat(end.y, "\n        ");
    }
    var OffsetXP1 = +(1 / 12 * x).toFixed(0);
    var OffsetXP2 = +(11 / 12 * x).toFixed(0);
    var offsetYP1 = +(1 / 3 * y).toFixed(0);
    var offsetYP2 = +(2 / 3 * y).toFixed(0);
    dir = start.x - end.x > 0 ? -1 : 1;
    p1 = "".concat(start.x + dir * OffsetXP1, ", ").concat(start.y + offsetYP1);
    p2 = "".concat(start.x + dir * OffsetXP2, ", ").concat(start.y + offsetYP2);
    return "\n        M ".concat(start.x, " ").concat(start.y - lineOffsetY, "\n        C ").concat(p1, " ").concat(p2, " ").concat(end.x, " ").concat(end.y, "\n    ");
};
/** 计算三角形路径 */
export var computeTrianglePath = function (start, width) { return "\n    M ".concat(start.x, " ").concat(start.y, "\n    l ").concat(width / 2, " 0\n    l ").concat(-width / 2, " ").concat(width, "\n    l ").concat(-width / 2, " ").concat(-width, "\n    Z\n"); };
export var getNodeSize = function (dom) {
    if (['string', 'number'].indexOf(typeof dom) > -1) {
        // eslint-disable-next-line no-param-reassign
        dom = document.getElementById("dom-map-".concat(dom));
    }
    if (!dom) {
        return {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
        };
    }
    return dom.getBoundingClientRect();
};
export var impactCheck = function (point, size, position) {
    var withinX = point.x >= position.x && point.x <= position.x + size.width;
    var withinY = point.y >= position.y && point.y <= position.y + size.height;
    return withinX && withinY;
};
/** 计算锚点位置 */
export var computeAnchorPo = function (anchor, parentNode) {
    var $anchor = document.getElementById(anchor);
    if (!$anchor) {
        return null;
    }
    var anchorSize = getNodeSize($anchor);
    var parentSize = getNodeSize(parentNode.id);
    var parentPosition = parentNode.position || { x: 0, y: 0 };
    var dX = anchorSize.left - parentSize.left;
    var dY = anchorSize.top - parentSize.top;
    var po = {
        x: parentPosition.x + dX + anchorSize.width / 2,
        y: parentPosition.y + dY + anchorSize.height,
    };
    if (Number.isNaN(po.x) || Number.isNaN(po.y)) {
        return null;
    }
    return po;
};
export var computeMaxAndMin = function (nodes) {
    // @ts-ignore
    if (!nodes.length || nodes.find(function (item) { return !item.position || [item.position.x, item.position.y].includes(undefined); })) {
        return null;
    }
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    nodes.forEach(function (_a) {
        var position = _a.position, id = _a.id;
        var nodeSize = getNodeSize(id);
        var x = position.x, y = position.y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + nodeSize.width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + nodeSize.height);
    });
    return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
    };
};
export var getMaxAndMinNodeId = function (nodes) {
    // @ts-ignore
    if (!nodes.length || nodes.find(function (item) { return !item.position || [item.position.x, item.position.y].includes(undefined); })) {
        return null;
    }
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    var minXId = null;
    var maxXId = null;
    var minYId = null;
    var maxYId = null;
    nodes.forEach(function (_a) {
        var position = _a.position, id = _a.id;
        var x = position.x, y = position.y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        if (x === minX) {
            minXId = id;
        }
        if (x === maxX) {
            maxXId = id;
        }
        if (y === minY) {
            minYId = id;
        }
        if (y === maxY) {
            maxYId = id;
        }
    });
    return {
        minXId: minXId,
        maxXId: maxXId,
        minYId: minYId,
        maxYId: maxYId
    };
};
/**
 * TODO: 缩放之后影响到计算判断, viewHeight 可视化高度区分判断是画布高度还是屏幕高度
 * 判断节点是否位于可视区域内
 * @param nodeId
 * @param doc
 * @returns
 */
export var isInViewPort = function (nodeId, doc) {
    var viewWidth = window.innerWidth || document.documentElement.clientWidth;
    // const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    var viewHeight = document.documentElement.offsetHeight;
    var _a = doc.getElementById("topology-node-".concat(nodeId)).getBoundingClientRect(), top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left;
    return (top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight);
};
export var computeContentCenter = function (nodes) {
    if (!computeMaxAndMin(nodes))
        return null;
    var _a = computeMaxAndMin(nodes), minX = _a.minX, maxX = _a.maxX, minY = _a.minY, maxY = _a.maxY;
    return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
    };
};
/**
 * 滚动 Y 轴距离顶部距离
 */
export var computeContentPostionY = function (nodes) {
    if (!computeMaxAndMin(nodes))
        return null;
    var _a = computeMaxAndMin(nodes), minX = _a.minX, maxX = _a.maxX, minY = _a.minY;
    return {
        x: (minX + maxX) / 2,
        y: minY,
    };
};
/** 计算节点连接处 */
export var computeNodeInputPo = function (node) {
    var $node = document.getElementById("dom-map-".concat(node.id));
    if (!$node) {
        return null;
    }
    var nodeSize = getNodeSize($node);
    // eslint-disable-next-line no-param-reassign
    node.position = node.position || { x: 0, y: 0 };
    var po = {
        x: node.position.x + nodeSize.width / 2,
        y: node.position.y,
    };
    if (Number.isNaN(po.x) || Number.isNaN(po.y)) {
        return null;
    }
    return po;
};
/** 计算鼠标相对画布位置 */
export var computeMouseClientToCanvas = function (clientX, clientY, $wrapper) {
    var rect = $wrapper.getBoundingClientRect();
    var dX = clientX - rect.left;
    var dY = clientY - rect.top;
    return {
        x: $wrapper.scrollLeft + dX,
        y: $wrapper.scrollTop + dY,
    };
};
export var createHashFromObjectArray = function (arr, field) { return arr.reduce(function (pre, cur) {
    var _a;
    var key = typeof field === 'string' ? cur[field] : field(cur);
    return __assign(__assign({}, pre), (_a = {}, _a[key] = cur, _a));
}, {}); };
/**
 * 判断对象是否存在一组 matchKey: matchValue
 * @param obj
 * @param matchKey
 * @param matchValue
 * @returns
 */
export var isMatchKeyValue = function (obj, matchKey, matchValue) {
    var isMatch = false;
    var loop = function (param) {
        // eslint-disable-next-line no-restricted-syntax
        for (var key in param) {
            if (Object.prototype.toString.call(param[key]) === '[object Object]' && param[key] !== null) {
                loop(param[key]);
            }
            else {
                // eslint-disable-next-line no-lonely-if
                if (key === matchKey) {
                    isMatch = (param[key] === matchValue);
                }
            }
        }
    };
    loop(obj);
    return isMatch;
};
export var TOPOLOGY_NODE_PREFIX = 'topology-node-';
export var getRealNodeDom = function (id) { return document.getElementById("".concat(TOPOLOGY_NODE_PREFIX).concat(id)); };
//# sourceMappingURL=index.js.map