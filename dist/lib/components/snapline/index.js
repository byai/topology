import React from "react";
var SnapLine = function (_a) {
    var _b;
    var _c = _a.alignmentLines, alignmentLines = _c === void 0 ? {} : _c;
    var nodeHeight = 0;
    var nodeWidth = 0;
    var lines = [];
    if ((_b = Object.keys(alignmentLines)) === null || _b === void 0 ? void 0 : _b.length) {
        /* eslint-disable */
        for (var lineId in alignmentLines) {
            var line = alignmentLines[lineId];
            if (line.width === "100%") { // 水平辅助线
                var y = line.top + nodeHeight / 2; // 辅助线位置加上节点高度的一半
                lines.push(React.createElement("line", { key: "horizontal", x1: line.left, y1: y, x2: "100%", y2: y, stroke: 'rgb(50,144,255', strokeWidth: 1 }));
            }
            else if (line.height === "100%") { // 垂直辅助线
                var x = line.left + nodeWidth / 2; // 辅助线位置加上节点宽度的一半
                lines.push(React.createElement("line", { key: "vertical", x1: x, y1: line.top, x2: x, y2: "100%", stroke: 'rgb(50,144,255', strokeWidth: 1 }));
            }
        }
    }
    return React.createElement("svg", { className: "snap-line-svg" }, lines);
};
export default SnapLine;
//# sourceMappingURL=index.js.map