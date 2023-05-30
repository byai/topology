import { useMemo } from 'react';

export default function LineText({
    lineTextDecorator,
    position,
    line,
    data
}: any) {
    return useMemo(() => lineTextDecorator(position, line), [data]);
}
