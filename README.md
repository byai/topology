# Topology

## 安装

```bash
yarn add @byai/topology
```

## 开发

```bash
yarn
yarn start
```

## 测试

```bash
yarn test
```

## 示例

http://localhost:3000


## 使用

见demo

## 组件

### Topology

#### props

<table class="table table-bordered table-striped">
    <thead>
        <tr>
            <th style="width: 100px;">name</th>
            <th style="width: 150px;">type</th>
            <th style="width: 150px;">default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>data</td>
            <td>object</td>
            <td>{ nodes: []; lines: [] }</td>
            <td>数据</td>
        </tr>
        <tr>
            <td>lineLinkageHighlight</td>
            <td>boolean</td>
            <td>false</td>
            <td>hover 节点线条是否联动高亮</td>
        </tr>
        <tr>
            <td>lineColor</td>
            <td>object</td>
            <td>{}</td>
            <td>线条颜色映射对象 eg: {'锚点1': '#82BEFF', '锚点2': '#FFA39E'}</td>
        </tr>
        <tr>
            <td>lineTextColor</td>
            <td>object</td>
            <td>{}</td>
            <td>线条上文字颜色映射对象 eg: {'锚点1': '#82BEFF', '锚点2': '#FFA39E'}</td>
        </tr>
        <tr>
            <td>lineOffsetY</td>
            <td>number</td>
            <td>0</td>
            <td>线条起始点向上偏移量</td>
        </tr>
        <tr>
            <td>startPointAnchorId</td>
            <td>string</td>
            <td></td>
            <td>保持所有线条起始点与 startPointAnchorId 线条一致</td>
        </tr>
        <tr>
            <td>lineTextMap</td>
            <td>object</td>
            <td>{}</td>
            <td>线条上文字与 anchorId 映射对象 eg: {'anchorId1': '锚点1', 'anchorId2': '锚点2'}</td>
        </tr>
        <tr>
            <td>lineTextDecorator</td>
            <td>(text: textPosition, line: ITopologyLine)</td>
            <td>-</td>
            <td>线条上文字装饰器</td>
        </tr>
        <tr>
            <td>showText</td>
            <td>(start: string) => boolean</td>
            <td>-</td>
            <td>当 anchorId 为 startPointAnchorId 时， 是否显示线条文字</td>
        </tr>
        <tr>
            <td>showBar</td>
            <td>bool</td>
            <td>true</td>
            <td>是否显示工具栏</td>
        </tr>
        <tr>
            <td>canConnectMultiLines</td>
            <td>bool</td>
            <td>false</td>
            <td>控制一个锚点是否可以连接多条线</td>
        </tr>
        <tr>
            <td>overlap</td>
            <td>bool</td>
            <td>false</td>
            <td>是否允许节点覆盖，默认允许，设置 true 时不允许</td>
        </tr>
        <tr>
            <td>overlapCallback</td>
            <td>() => void</td>
            <td></td>
            <td>overlap 为 true 时的回调</td>
        </tr>
        <tr>
            <td>overlapOffset</td>
            <td>{}</td>
            <td>{offsetX: 0, offsetY: 0}</td>
            <td>overlap 为 true 时，节点的 x，y 偏移量</td>
        </tr>
        <tr>
            <td>customPostionHeight</td>
            <td>number</td>
            <td>0</td>
            <td>未设置 customPostionHeight 画布默认居中展示，当设置 customPostionHeight 时，画布距离顶部 customPostionHeight</td>
        </tr>
        <tr>
            <td>readOnly</td>
            <td>bool</td>
            <td>false</td>
            <td>只读模式，为true时不可编辑</td>
        </tr>
        <tr>
            <td>prevNodeStyle</td>
            <td>object</td>
            <td>-</td>
            <td>控制预览节点样式，目前支持配置 border、background 属性</td>
        </tr>
        <tr>
            <td>isReduceRender</td>
            <td>bool</td>
            <td>false</td>
            <td>控制节点 shouldComponentUpdate 生命周期的返回值</td>
        </tr>
        <tr>
            <td>autoLayout</td>
            <td>bool</td>
            <td>false</td>
            <td>自动布局，当数据中没有position属性时将自动计算布局。</td>
        </tr>
        <tr>
            <td>renderTreeNode</td>
            <td>(node,decorators) => ReactNode</td>
            <td>-</td>
            <td>子节点render方法，接收节点数据，返回JSX。</td>
        </tr>
         <tr>
            <td>getInstance</td>
            <td>(instance: Topology) => void</td>
            <td>-</td>
            <td>返回组件实例，用于调用组件内部的方法。</td>
        </tr>
        <tr>
            <td>onChange</td>
            <td>(data, changeType) => void</td>
            <td>-</td>
            <td>数据发成改变时触发，changeType为改变的类型</td>
        </tr>
        <tr>
            <td>onSelect</td>
            <td>(data) => void</td>
            <td>-</td>
            <td>选中数据时触发，返回当前选中的数据（包含节点、线段）</td>
        </tr>
        <tr>
            <td>sortChildren</td>
            <td>(parent, children) => sortedChildren</td>
            <td>-</td>
            <td>子节点排序回调，可选，默认无。</td>
        </tr>
    </tbody>
</table>

node options 中 一些可配置参数
<table class="table table-bordered table-striped">
    <thead>
        <tr>
            <th style="width: 100px;">name</th>
            <th style="width: 150px;">type</th>
            <th style="width: 150px;">default</th>
            <th>description</th>
        </tr>
    </thead>
    <tr>
        <td>id</td>
        <td>string</td>
        <td>-</td>
        <td>节点id</td>
    </tr>
    <tr>
        <td>canDrag</td>
        <td>boolean</td>
        <td>true</td>
        <td>控制节点是否可拖拽</td>
    </tr>
    <tr>
        <td>dragChild</td>
        <td>boolean</td>
        <td>false</td>
        <td>设置当前节点下的子节点是否需要联动拖动</td>
    </tr>
    <tr>
        <td>filterOverlap</td>
        <td>boolean</td>
        <td>false</td>
        <td>控制节点在设置 overlap 为 true 时是否仍允许被覆盖</td>
    </tr>
</table>

### getInstance

返回topology组件的实例，可通过实例调用组件内部的方法：

#### scrollCanvasToCenter():void

移动到中心，当所有节点都有位置数据（positions）时，移动的中心点为内容的中心，否则为画布的中心。

#### autoLayout():void

自动计算布局

### decorators

renderTreeNode的第二个参数，包含以下装饰器函数：

#### anchorDecorator

anchorDecorator是一个高阶函数，经过 anchorDecorator 包装的控件将变成一个锚点。

##### 用法

```javascript
anchorDecorator(options)(ReactNode)
```

##### options参数
<table class="table table-bordered table-striped">
    <thead>
        <tr>
            <th style="width: 100px;">name</th>
            <th style="width: 150px;">type</th>
            <th style="width: 150px;">default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>anchorId</td>
            <td>string</td>
            <td>-</td>
            <td>锚点唯一id，如果不传将默认生成一个自增的id</td>
        </tr>
    </tbody>
</table>

### TemplateWrapper

模板装饰器，用于包装模板组件

#### 用法
disabled 字段控制 TemplateNode 是否启用
```javascript
<TemplateWrapper disabled generator={this.generatorNodeData}>
    <div>模板节点</div>
</TemplateWrapper>

```

#### props

<table class="table table-bordered table-striped">
    <thead>
        <tr>
            <th style="width: 100px;">name</th>
            <th style="width: 150px;">type</th>
            <th style="width: 150px;">default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>data</td>
            <td>() => nodeData</td>
            <td>-</td>
            <td>数据生成器，用于产生节点数据</td>
        </tr>
    </tbody>
</table>
