/* eslint-disable no-undef */
import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { toMatchDiffSnapshot } from 'snapshot-diff';
import Line from '..';

expect.extend({ toMatchDiffSnapshot });
afterEach(cleanup);

describe('line', () => {
    test('正常render', () => {
        const svg = document.createElement('svg');
        const { baseElement } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        expect(baseElement).toMatchSnapshot();
    });
    test('选中时', () => {
        const svg = document.createElement('svg');
        const { baseElement } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                selected
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        expect(baseElement).toMatchSnapshot();
    });
    test('有数据时', () => {
        const svg = document.createElement('svg');
        const { baseElement } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                selected
                data={{ start: '1-0', end: '2' }}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        expect(baseElement).toMatchSnapshot();
    });
    test('鼠标操作： 第一个path移入、移出、点击', () => {
        const svg = document.createElement('svg');
        const { asFragment, container } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                data={{ start: '1-0', end: '2' }}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        const firstRender = asFragment();
        // 移入
        fireEvent.mouseEnter(container.firstElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
        // 移出
        const secondRender = asFragment();
        fireEvent.mouseLeave(container.firstElementChild);
        expect(secondRender).toMatchDiffSnapshot(asFragment());
        // 点击
        fireEvent.click(container.firstElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
    });

    test('鼠标操作： 第二个path移入、移出、点击', () => {
        const svg = document.createElement('svg');
        const { asFragment, container } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                data={{ start: '1-0', end: '2' }}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        const firstRender = asFragment();
        // 移入
        fireEvent.mouseEnter(container.lastElementChild);
        expect(firstRender).toMatchDiffSnapshot(asFragment());
        // 移出
        const secondRender = asFragment();
        fireEvent.mouseLeave(container.lastElementChild);
        expect(secondRender).toMatchDiffSnapshot(asFragment());
    });
    test('单选、多选', () => {
        const svg = document.createElement('svg');
        const { container } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                data={{ start: '1-0', end: '2' }}
                onSelect={() => null}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        fireEvent.click(container.firstElementChild);
        fireEvent(
            container.firstElementChild,
            new MouseEvent('click', {
                metaKey: true,
                ctrlKey: true,
            }),
        );
    });
    test('取消选中', () => {
        const svg = document.createElement('svg');
        const { container } = render(
            <Line
                start={{ x: 0, y: 0 }}
                end={{ x: 100, y: 100 }}
                selected
                data={{ start: '1-0', end: '2' }}
                onSelect={() => null}
            />,
            {
                container: document.body.appendChild(svg),
            },
        );
        fireEvent.click(container.firstElementChild);
        fireEvent(
            container.firstElementChild,
            new MouseEvent('click', {
                metaKey: true,
                ctrlKey: true,
            }),
        );
    });
});
