/* eslint-disable no-undef */
import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { toMatchDiffSnapshot } from 'snapshot-diff';
import Line from '..';
expect.extend({ toMatchDiffSnapshot: toMatchDiffSnapshot });
afterEach(cleanup);
describe('line', function () {
    test('正常render', function () {
        var svg = document.createElement('svg');
        var baseElement = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 } }), {
            container: document.body.appendChild(svg),
        }).baseElement;
        expect(baseElement).toMatchSnapshot();
    });
    test('选中时', function () {
        var svg = document.createElement('svg');
        var baseElement = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, selected: true }), {
            container: document.body.appendChild(svg),
        }).baseElement;
        expect(baseElement).toMatchSnapshot();
    });
    test('有数据时', function () {
        var svg = document.createElement('svg');
        var baseElement = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, selected: true, data: { start: '1-0', end: '2' } }), {
            container: document.body.appendChild(svg),
        }).baseElement;
        expect(baseElement).toMatchSnapshot();
    });
    test('鼠标操作： 第一个path移入、移出、点击', function () {
        var svg = document.createElement('svg');
        var _a = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, data: { start: '1-0', end: '2' } }), {
            container: document.body.appendChild(svg),
        }), asFragment = _a.asFragment, container = _a.container;
        var firstRender = asFragment();
        // 移入
        fireEvent.mouseEnter(container.firstElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
        // 移出
        var secondRender = asFragment();
        fireEvent.mouseLeave(container.firstElementChild);
        expect(secondRender).toMatchDiffSnapshot(asFragment());
        // 点击
        fireEvent.click(container.firstElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
    });
    test('鼠标操作： 第二个path移入、移出、点击', function () {
        var svg = document.createElement('svg');
        var _a = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, data: { start: '1-0', end: '2' } }), {
            container: document.body.appendChild(svg),
        }), asFragment = _a.asFragment, container = _a.container;
        var firstRender = asFragment();
        // 移入
        fireEvent.mouseEnter(container.lastElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
        // 移出
        var secondRender = asFragment();
        fireEvent.mouseLeave(container.lastElementChild);
        expect(secondRender).toMatchDiffSnapshot(asFragment());
    });
    test('单选、多选', function () {
        var svg = document.createElement('svg');
        var container = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, data: { start: '1-0', end: '2' }, onSelect: function () { return null; } }), {
            container: document.body.appendChild(svg),
        }).container;
        fireEvent.click(container.firstElementChild);
        fireEvent(container.firstElementChild, new MouseEvent('click', {
            metaKey: true,
            ctrlKey: true,
        }));
    });
    test('取消选中', function () {
        var svg = document.createElement('svg');
        var container = render(React.createElement(Line, { start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, selected: true, data: { start: '1-0', end: '2' }, onSelect: function () { return null; } }), {
            container: document.body.appendChild(svg),
        }).container;
        fireEvent.click(container.firstElementChild);
        fireEvent(container.firstElementChild, new MouseEvent('click', {
            metaKey: true,
            ctrlKey: true,
        }));
    });
});
//# sourceMappingURL=index.js.map