import * as React from 'react';
export var defaultContext = {
    linking: false,
    activeLine: null,
    impactNode: null,
    readOnly: false,
    hoverCurrentNode: null,
    dragging: false,
    selectedData: {
        nodes: [],
        lines: [],
    },
};
var Context = React.createContext(defaultContext);
export var Provider = Context.Provider, Consumer = Context.Consumer;
//# sourceMappingURL=context.js.map