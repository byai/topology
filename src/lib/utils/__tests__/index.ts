/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import {
    shouldAutoLayout,
    impactCheck,
    createHashFromObjectArray,
    getNodeSize,
    computeTrianglePath,
    computeMouseClientToCanvas,
    computeContentCenter,
    computeAnchorPo,
    // computeCanvasPo,
    computeNodeInputPo,
} from '..';

test('shouldAutoLayout', () => {
    const nodeArray = [{ id: '1' }, { id: '2' }];
    const nodeArray2 = [{ id: '2', position: { x: 1, y: 2 } }, { id: '1' }];
    const nodeArray3 = [{ id: '2', position: { x: 1, y: 2 } }, { id: '1', position: { x: 1, y: 3 } }];
    expect(shouldAutoLayout([])).toBe(false);
    expect(shouldAutoLayout(nodeArray)).toBe(true);
    expect(shouldAutoLayout(nodeArray2)).toBe(false);
    expect(shouldAutoLayout(nodeArray3)).toBe(false);
});

test('impactCheck', () => {
    expect(impactCheck({ x: 0, y: 0 }, { width: 100, height: 100 }, { x: 0, y: 0 })).toBe(true);
    expect(impactCheck({ x: 50, y: 50 }, { width: 100, height: 100 }, { x: 150, y: 150 })).toBe(false);
    expect(impactCheck({ x: 100, y: 100 }, { width: 50, height: 50 }, { x: 0, y: 0 })).toBe(false);
});

test('createHashFromObjectArray', () => {
    expect(
        createHashFromObjectArray(
            [
                { name: 'yunnan', sex: 'male' },
                { name: 'fazheng', sex: 'male' },
            ],
            'name',
        ),
    ).toEqual({
        yunnan: { name: 'yunnan', sex: 'male' },
        fazheng: { name: 'fazheng', sex: 'male' },
    });
});

describe('getNodeSize', () => {
    let flag = 0;
    const originDocumentGetElementById = document.getElementById;
    beforeEach(() => {
        if (flag === 0) {
            document.getElementById = (id: string) => ({
                getBoundingClientRect: () => ({
                    width: 100,
                    height: 100,
                    left: 100,
                    top: 100,
                }),
            }) as HTMLElement;
            flag += 1;
        } else {
            document.getElementById = (id: string) => null;
        }
    });
    afterEach(() => {
        document.getElementById = originDocumentGetElementById;
    });

    test('getNodeSize', async () => {
        expect(
            getNodeSize('1'),
        ).toEqual({
            width: 100,
            height: 100,
            left: 100,
            top: 100,
        });
    });
    test('getNodeSize', async () => {
        expect(
            getNodeSize('1'),
        ).toEqual({
            width: 0,
            height: 0,
            left: 0,
            top: 0,
        });
    });
});

test('computeTrianglePath', () => {
    expect(computeTrianglePath({ x: 50, y: 50 }, 20)).toBe(`
    M ${50} ${50}
    l ${10} 0
    l ${-10} ${20}
    l ${-10} ${-20}
    Z
`);
});

test('computeMouseClientToCanvas', () => {
    const wrapper = {
        scrollLeft: 1000,
        scrollTop: 1000,
        getBoundingClientRect: () => ({
            left: 100,
            top: 100,
        }),
    } as HTMLDivElement;

    expect(computeMouseClientToCanvas(150, 150, wrapper)).toEqual({
        x: 1050,
        y: 1050,
    });
});

describe('computeContentCenter', () => {
    const originDocumentGetElementById = document.getElementById;
    beforeEach(() => {
        document.getElementById = (id: string) => ({
            getBoundingClientRect: () => ({
                width: 100,
                height: 100,
                left: 100,
                top: 100,
            }),
        }) as HTMLElement;
    });
    afterEach(() => {
        document.getElementById = originDocumentGetElementById;
    });

    test('数据不为空时，返回中心点', () => {
        expect(computeContentCenter([
            { id: '1', position: { x: 0, y: 0 } },
            { id: '2', position: { x: 50, y: 40 } },
            { id: '3', position: { x: 100, y: 100 } },
            { id: '4', position: { x: 0, y: 500 } },
        ])).toEqual({
            x: 100,
            y: 300,
        });
    });
    test('数据为空时，返回null', () => {
        expect(computeContentCenter([])).toBeNull();
    });
});

describe('computeAnchorPo', () => {
    const originDocumentGetElementById = document.getElementById;
    beforeAll(() => {
        document.getElementById = (id: string) => {
            if (/anchor-1/.test(id)) {
                return null;
            }
            if (/anchor-2/.test(id)) {
                return {
                    getBoundingClientRect: () => ({
                        left: 100,
                        top: 100,
                        width: 30,
                        height: 20,
                    }),
                } as HTMLDivElement;
            }
            if (/anchor-3/.test(id)) {
                return {
                    getBoundingClientRect: () => ({
                        left: 100,
                        top: 100,
                        width: Number.NaN,
                        height: 20,
                    }),
                } as HTMLDivElement;
            }
            if (/parent/.test(id)) {
                return {
                    getBoundingClientRect: () => ({
                        left: 50,
                        top: 50,
                    }),
                } as HTMLDivElement;
            }
            return null;
        };
    });
    afterAll(() => {
        document.getElementById = originDocumentGetElementById;
    });

    test('获取不到锚点时返回null', () => {
        expect(computeAnchorPo('anchor-1', { id: 'parent' })).toBeNull();
    });
    test('正常返回锚点相对父节点的位置', () => {
        expect(computeAnchorPo(
            'anchor-2',
            { id: 'parent', position: { x: 1000, y: 1000 } },
        )).toEqual({
            x: 1065,
            y: 1070,
        });
    });
    test('计算值有NaN时返回null', () => {
        expect(computeAnchorPo('anchor-3', { id: 'parent' })).toBeNull();
    });
});

describe('computeAnchorPo', () => {
    const orgPageXOffset = window.pageXOffset;
    const orgPageYOffset = window.pageYOffset;
    beforeAll(() => {
        // @ts-ignore
        window.pageXOffset = 0;
        // @ts-ignore
        window.pageYOffset = 0;
    });
    afterAll(() => {
        // @ts-ignore
        window.pageXOffset = orgPageXOffset;
        // @ts-ignore
        window.pageYOffset = orgPageYOffset;
    });

    // test('返回画布中的坐标', () => {
    //     expect(computeCanvasPo(
    //         { x: 200, y: 200 },
    //         {
    //             scrollLeft: 100,
    //             scrollTop: 100,
    //             getBoundingClientRect: () => ({
    //                 left: 50,
    //                 top: 50,
    //             }) as ClientRect,
    //         } as HTMLDivElement,
    //     )).toEqual({
    //         x: 250,
    //         y: 250,
    //     });
    // });
});

describe('computeNodeInputPo', () => {
    const originDocumentGetElementById = document.getElementById;
    beforeAll(() => {
        document.getElementById = (id: string) => {
            if (/node-1/.test(id)) {
                return null;
            }
            if (/node-2/.test(id)) {
                return {
                    getBoundingClientRect: () => ({
                        left: 100,
                        top: 100,
                        width: 100,
                        height: 50,
                    }),
                } as HTMLDivElement;
            }
            if (/node-3/.test(id)) {
                return {
                    getBoundingClientRect: () => ({
                        left: 100,
                        top: 100,
                        width: Number.NaN,
                        height: 20,
                    }),
                } as HTMLDivElement;
            }
            return null;
        };
    });
    afterAll(() => {
        document.getElementById = originDocumentGetElementById;
    });

    test('获取不到节点时返回null', () => {
        expect(computeNodeInputPo({ id: 'node-1' })).toBeNull();
    });
    test('正常返回连接点位置', () => {
        expect(computeNodeInputPo({ id: 'node-2' })).toEqual({
            x: 50,
            y: 0,
        });
    });
    test('计算值有NaN时返回null', () => {
        expect(computeNodeInputPo({ id: 'node-3' })).toBeNull();
    });
});
