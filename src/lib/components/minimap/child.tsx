import React from 'react';
import './index.less';

interface IChildProps {
    width: number;
    height: number;
    left: number;
    top: number;
}

class Child extends React.Component<IChildProps> {
    constructor(props: IChildProps) {
        super(props);
        this.state = {
        };
    }

    render() {
        const {
            width, height, left, top
        } = this.props;
        return (
            <div
                style={{
                    position: 'absolute',
                    width,
                    height,
                    left,
                    top,
                }}
                className="minimap-children"
            />
        );
    }
}

export default Child;
