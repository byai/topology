import HTML5BackEnd from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { convertToTree, onlyOneParent, onlyOneRoot } from './utils/tree';
import { computeContentCenter } from './utils';

export const Utils = {
    convertToTree,
    onlyOneParent,
    onlyOneRoot,
    computeContentCenter,
};

export const topologyWrapper = DragDropContext(HTML5BackEnd);
// eslint-disable-next-line import/named
export { default as Topology } from './components/topology';
export { default as TemplateWrapper } from './components/template-wrapper';
