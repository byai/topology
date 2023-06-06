export var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["ADD_NODE"] = 0] = "ADD_NODE";
    ChangeType[ChangeType["ADD_LINE"] = 1] = "ADD_LINE";
    ChangeType[ChangeType["LAYOUT"] = 2] = "LAYOUT";
    ChangeType[ChangeType["DELETE"] = 3] = "DELETE";
    ChangeType[ChangeType["EDIT_LINE"] = 4] = "EDIT_LINE";
    ChangeType[ChangeType["EDIT_NODE"] = 5] = "EDIT_NODE";
    ChangeType[ChangeType["ADD_COMPONENT"] = 6] = "ADD_COMPONENT";
})(ChangeType || (ChangeType = {}));
export var NodeTypes;
(function (NodeTypes) {
    NodeTypes["NORMAL_NODE"] = "\u666E\u901A\u8282\u70B9";
    NodeTypes["TEMPLATE_NODE"] = "\u6A21\u677F\u8282\u70B9";
    NodeTypes["ANCHOR"] = "\u951A\u70B9";
    NodeTypes["LINE_POINT"] = "\u7EBF\u6BB5\u70B9";
})(NodeTypes || (NodeTypes = {}));
export var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["BACKSPACE"] = 8] = "BACKSPACE";
    KeyCode[KeyCode["DELETE"] = 46] = "DELETE";
})(KeyCode || (KeyCode = {}));
/** 选中元素类型 */
export var SelectedType;
(function (SelectedType) {
    SelectedType[SelectedType["NODE"] = 0] = "NODE";
    SelectedType[SelectedType["LINE"] = 1] = "LINE";
    SelectedType[SelectedType["NONE"] = 2] = "NONE";
})(SelectedType || (SelectedType = {}));
/** 编辑类型
 * ADD: 新增
 * EDIT_START: 编辑起点
 * EDIT_END: 编辑终点
 */
export var LineEditType;
(function (LineEditType) {
    LineEditType["ADD"] = "add";
    LineEditType["EDIT_START"] = "start";
    LineEditType["EDIT_END"] = "end";
})(LineEditType || (LineEditType = {}));
//# sourceMappingURL=declare.js.map