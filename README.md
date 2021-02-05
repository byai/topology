# Topology

## 安装

```bash
yarn add topology-byfe
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
            <td>readOnly</td>
            <td>bool</td>
            <td>false</td>
            <td>只读模式，为true时不可编辑</td>
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
        <tr>
            <td>renderToolBars</td>
            <td>() => React.ReactNode</td>
            <td>-</td>
            <td>为null时不渲染，默认渲染。</td>
        </tr>
    </tbody>
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

```javascript
<TemplateWrapper generator={this.generatorNodeData}>
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

#### BAP 版本说明

将纵向连接改为横向，修改函数如下：

-   computeAnchorPo
-   computeNodeInputPo
-   computeLinePath,采用`d3-path`绘制贝塞尔连接线
-   computeTrianglePath
-   computePosition
