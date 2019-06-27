/* eslint-disable no-undef */
import {
    onlyOneRoot,
    onlyOneParent,
    hasRing,
    convertToTree,
    processTree,
} from '../tree';

test('onlyOneRoot', () => {
    expect(onlyOneRoot({
        lines: [],
        nodes: [],
    })).toBe(true);
    expect(onlyOneRoot({
        lines: [],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
        ],
    })).toBe(false);
    expect(onlyOneRoot({
        lines: [
            { start: '1-0', end: '2' },
            { start: '1-1', end: '3' },
        ],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
        ],
    })).toBe(true);
});

test('onlyOneParent', () => {
    expect(onlyOneParent({
        lines: [
            { start: '1-0', end: '2' },
            { start: '1-1', end: '3' },
            { start: '3-0', end: '2' },
        ],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
        ],
    })).toBe(false);
    expect(onlyOneParent({
        lines: [
            { start: '1-0', end: '2' },
            { start: '1-1', end: '3' },
            { start: '2-0', end: '4' },
            { start: '3-0', end: '5' },
        ],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
        ],
    })).toBe(true);
});

test('hasRing', () => {
    expect(hasRing({
        id: '1',
        childrenList: [
            {
                id: '2',
                childrenList: [{ id: '4' }],
            },
            {
                id: '3',
                childrenList: [{ id: '4' }],
            },
        ],
    })).toBe(true);
    expect(hasRing({
        id: '1',
        childrenList: [
            {
                id: '2',
                childrenList: [{ id: '4' }],
            },
            {
                id: '3',
                childrenList: [{ id: '5' }],
            },
        ],
    })).toBe(false);
});

test('convertToTree', () => {
    const arr = {
        lines: [
            { start: '1-0', end: '2' },
            { start: '1-1', end: '3' },
            { start: '2-0', end: '4' },
            { start: '2-1', end: '5' },
            { start: '3-0', end: '6' },
            { start: '6-0', end: '7' },
            { start: '6-1', end: '8' },
        ],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
            { id: '6' },
            { id: '7' },
            { id: '8' },
        ],
    };
    const res = {
        id: '1',
        childrenList: [
            {
                id: '2',
                anchors: ['0'],
                parent: '1',
                childrenList: [
                    { id: '4', anchors: ['0'], parent: '2' },
                    { id: '5', anchors: ['1'], parent: '2' },
                ],
            },
            {
                id: '3',
                anchors: ['1'],
                parent: '1',
                childrenList: [
                    {
                        id: '6',
                        parent: '3',
                        anchors: ['0'],
                        childrenList: [
                            { id: '7', anchors: ['0'], parent: '6' },
                            { id: '8', anchors: ['1'], parent: '6' },
                        ],
                    },
                ],
            },
        ],
    };
    expect(convertToTree(arr, data => data)).toEqual(res);
    expect(convertToTree({
        lines: [],
        nodes: [],
    })).toBeNull();
});

test('processTree', () => {
    const tree = {
        id: '1',
        childrenList: [
            {
                id: '2',
                anchors: ['0'],
                parent: '1',
            },
            {
                id: '3',
                anchors: ['1'],
                parent: '1',
            },
        ],
    };
    const res = {
        id: '1',
        key: '1',
        childrenList: [
            {
                id: '2',
                key: '2',
                anchors: ['0'],
                parent: '1',
            },
            {
                id: '3',
                key: '3',
                anchors: ['1'],
                parent: '1',
            },
        ],
    };
    expect(
        processTree(tree, node => ({ ...node, key: node.id })),
    ).toEqual(res);
});
