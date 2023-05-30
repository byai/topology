/* eslint-disable no-undef */
import selectNodes, { SelectMode } from '../selectNodes';

const data = {
    nodes: Array.from(
        { length: 14 },
        (_, index) => ({ id: `${index}` }),
    ),
    lines: [
        { start: '1-0', end: '2' },
        { start: '1-1', end: '3' },
        { start: '2-0', end: '4' },
        { start: '2-1', end: '5' },
        { start: '3-0', end: '6' },
        { start: '3-1', end: '7' },
        { start: '6-0', end: '8' },
        { start: '6-1', end: '9' },
        { start: '6-2', end: '10' },
        { start: '8-0', end: '11' },
        { start: '8-1', end: '12' },
        { start: '10-0', end: '13' },
        { start: '10-1', end: '14' },
    ],
};

describe('selectNodes单选', () => {
    test('未选中其他元素时，选中节点', () => {
        expect(
            selectNodes({
                data,
                selectedData: { nodes: [], lines: [] },
            })({
                node: { id: '1' },
                mode: SelectMode.NORMAL,
            }),
        ).toEqual({
            lines: [],
            nodes: [{ id: '1' }],
        });
    });

    test('已选中时，取消选中', () => {
        expect(
            selectNodes({
                data,
                selectedData: { nodes: [{ id: '1' }], lines: [] },
            })({
                node: { id: '1' },
                mode: SelectMode.NORMAL,
            }),
        ).toEqual({
            lines: [],
            nodes: [],
        });
    });

    test('已选中其他节点时, 选中节点，并取消其他元素', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    nodes: [{ id: '6' }, { id: '3' }, { id: '8' }],
                    lines: [
                        { start: '3-0', end: '6' },
                        { start: '6-0', end: '8' },
                    ],
                },
            })({
                node: { id: '1' },
                mode: SelectMode.NORMAL,
            }),
        ).toEqual({
            lines: [],
            nodes: [{ id: '1' }],
        });
    });
});

describe('selectNodes多选(CTRL/COMMAND)', () => {
    test('选中节点时，如果有其父子节点已选中，则选中其关系连线', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    nodes: [{ id: '1' }, { id: '4' }],
                    lines: [],
                },
            })({
                node: { id: '2' },
                mode: SelectMode.MUL_NORMAL,
            }),
        ).toMatchObject({
            lines: [{ start: '1-0', end: '2' }, { start: '2-0', end: '4' }],
            nodes: [{ id: '1' }, { id: '2' }, { id: '4' }],
        });
    });

    test('选中节点时，将新增节点加入选中数据，不清除原本数据', () => {
        expect(
            selectNodes({
                data,
                selectedData: { nodes: [{ id: '2' }], lines: [] },
            })({
                node: { id: '6' },
                mode: SelectMode.MUL_NORMAL,
            }),
        ).toEqual({
            lines: [],
            nodes: [{ id: '2' }, { id: '6' }],
        });
    });

    test('选中节点时，如果有其父子节点已选中，则选中其关系连线', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    lines: [{ start: '1-0', end: '2' }, { start: '2-0', end: '4' }],
                    nodes: [{ id: '1' }, { id: '4' }, { id: '2' }],
                },
            })({
                node: { id: '2' },
                mode: SelectMode.MUL_NORMAL,
            }),
        ).toEqual({
            nodes: [{ id: '1' }, { id: '4' }],
            lines: [],
        });
    });
});

describe('selectNodes多选(CTRL/COMMAND + SHIFT)', () => {
    test('选中节点时，同时选中其子节点', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    nodes: [{ id: '6' }, { id: '8' }],
                    lines: [{ start: '6-0', end: '8' }],
                },
            })({
                node: { id: '1' },
                mode: SelectMode.MULTI,
            }),
        ).toMatchObject({
            lines: [
                { start: '1-0', end: '2' },
                { start: '1-1', end: '3' },
                { start: '3-0', end: '6' },
                { start: '6-0', end: '8' },
            ],
            nodes: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '6' }, { id: '8' }],
        });
    });

    test('选中节点时，同时选中其子节点, 不清除其他节点，如果父节点已选中，同时选中关系联系', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    nodes: [{ id: '13' }, { id: '1' }],
                    lines: [],
                },
            })({
                node: { id: '3' },
                mode: SelectMode.MULTI,
            }),
        ).toMatchObject({
            lines: [{ start: '1-1', end: '3' }, { start: '3-0', end: '6' }, { start: '3-1', end: '7' }],
            nodes: [{ id: '1' }, { id: '3' }, { id: '6' }, { id: '7' }, { id: '13' }],
        });
    });

    test('已选中节点时，只取消该节点及其子节点和关系', () => {
        expect(
            selectNodes({
                data,
                selectedData: {
                    lines: [
                        { start: '1-0', end: '2' },
                        { start: '1-1', end: '3' },
                        { start: '6-0', end: '8' },
                    ],
                    nodes: [
                        { id: '13' },
                        { id: '1' },
                        { id: '2' },
                        { id: '3' },
                        { id: '6' },
                        { id: '8' },
                    ],
                },
            })({
                node: { id: '1' },
                mode: SelectMode.MULTI,
            }),
        ).toEqual({
            lines: [{ start: '6-0', end: '8' }],
            nodes: [{ id: '13' }, { id: '6' }, { id: '8' }],
        });
    });
});
