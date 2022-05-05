import { useMemo } from 'react';

export default function LineText({
    lineTextDecorator,
    position,
    line,
    data
}) {
    return useMemo(() => lineTextDecorator(position, line), [data]);
}
