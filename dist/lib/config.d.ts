declare const config: {
    transition: string;
    autoLayout: {
        /** 节点间水平间距 */
        horizontalSpacing: number;
        /** 节点间垂直间距 */
        verticalSpacing: number;
    };
    canvas: {
        /** 画布宽度 */
        width: number;
        /** 画布高度 */
        height: number;
    };
    line: {
        /** 线条宽度 */
        strokeWidth: number;
        strokeLargeWidth: number;
        /** 箭头宽度 */
        triangleWidth: number;
        /** 触发区域宽度 */
        triggerWidth: number;
    };
};
export default config;
