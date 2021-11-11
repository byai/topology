import * as React from 'react';
import { ITopologyContext } from '../declare';

export const defaultContext: ITopologyContext = {
    linking: false,
    activeLine: null,
    impactNode: null,
    readOnly: false,
    hoverCurrentNode: null,
    selectedData: {
        nodes: [],
        lines: [],
    },
};

const Context = React.createContext(defaultContext);

export const {
    Provider,
    Consumer,
} = Context;
