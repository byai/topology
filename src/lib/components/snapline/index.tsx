import React from "react";

const SnapLine = ({ alignmentLines = {} }) => {
    const nodeHeight = 0;
    const nodeWidth = 0;
    const lines = [];

    if (Object.keys(alignmentLines)?.length) {
        /* eslint-disable */
        for (const lineId in alignmentLines) {

            const line = alignmentLines[lineId];
            if (line.width === "100%") { // 水平辅助线
                const y = line.top + nodeHeight / 2; // 辅助线位置加上节点高度的一半
                lines.push(<line key="horizontal" x1={line.left} y1={y} x2={"100%"} y2={y} stroke='rgb(50,144,255' strokeWidth={1} />);

            } else if (line.height === "100%") { // 垂直辅助线
                const x = line.left + nodeWidth / 2; // 辅助线位置加上节点宽度的一半
                lines.push(<line key="vertical" x1={x} y1={line.top} x2={x} y2="100%" stroke='rgb(50,144,255' strokeWidth={1} />);
            }
        }
    }

    return <svg className="snap-line-svg">{lines}</svg>;

};

export default SnapLine;
