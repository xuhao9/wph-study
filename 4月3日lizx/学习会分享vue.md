### vue 渲染

##### 猜想下面代码运行，页面渲染几次？

```javascript
import Vue from 'Vue'
new Vue({
  el: '#app',
  template: '<div>{{val}}</div>',
  data () {
    return {
      val: 'init'
    }
  },
  mounted () {
    this.val = '我是第一次页面渲染'
    this.val = '我是第二次页面渲染'
  }
})
```

##### 异步渲染

 vue内部的渲染机制，实际上页面只会渲染一次，把第一次的赋值所带来的的响应与第二次的赋值所带来的的响应进行一次合并，将最终的val只做一次页面渲染。和react的render函数类似。

##### 为什么要异步渲染？

1.用户：多次中间值赋值页面会有闪烁效果，用户体验不好。

2.性能：最后一个值前面的值都是无用值，渲染增加性能消耗。还有就是数据变化，会引起浏览器重绘渲染或是重排渲染，多次渲染可能出现卡顿。类似节流函数。

##### 如何实现的异步渲染？

**原理**：vue中异步渲染实际在数据每次变化时，将其所要引起页面变化的部分都放到一个异步API的回调函数里，直到同步代码执行完之后，异步回调开始执行，最终将同步代码里所有的需要渲染变化的部分合并起来，最终执行一次渲染操作。

**以上面代码为例**：第一次val赋值，vue会把这个渲染变化暂存，第二次val赋值，vue也会把渲染变化暂存起来，最后把这些渲染操作丢到异步api， Promise.then 的回调函数中去，等到页面所有同步的代码执行完后，在去执行then函数的回调函数，然后遍历这个存储数据变化的全局数组，按id区分新旧值取最终值，确定优先级，最后合并一套需要展示到页面的数据，让页面去渲染。（异步渲染过程图：https://user-gold-cdn.xitu.io/2020/3/29/17125ca5b7fd0cb2?imageView2/0/w/1280/h/960/format/webp/ignore-error/1）

##### nextTick的实现原理

首先nextTick并不是浏览器本身提供的一个异步api，而是vue中，用过由浏览器本身提供的原生异步api封装而成的一个异步封装方法.

它对于浏览器异步api的选用规则如下，Promise存在取由Promise.then，不存在Promise则取MutationObserver，MutationObserver不存在setImmediate，setImmediate不存在最后取setTimeout来实现。



##### vue能不能同步渲染？

1，**Vue.config.async = false**

源码默认Vue.config.async = true, 当config里的async的值为为false的情况下，并没有将flushSchedulerQueue加到nextTick里，而是直接执行了flushSchedulerQueue，就相当于把本次data里的值变化时，页面做了同步渲染。

```javascript
function queueWatcher (watcher) {
  ...
  // 在全局队列里存储将要响应的变化update函数
  queue.push(watcher);
  ...
  // 当async配置是false的时候，页面更新是同步的
  if (!config.async) {
    flushSchedulerQueue();
    return
  }
  // 将页面更新函数放进异步API里执行，同步代码执行完开始执行更新页面函数
  nextTick(flushSchedulerQueue);
}
```

Vue.config.async = false 修改一下就可以了。

2，**this._watcher.sync = true**

在Watch的update方法执行源码里，可以看到当this.sync为true时，这时候的渲染也是同步的。

```javascript
// 源码
Watcher.prototype.update = function update () {
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};
// eg
new Vue({
  el: '#app',
  sync: true,
  template: '<div>{{val}}</div>',
  data () {
    return { val: 0 }
  },
  mounted () {
    this._watcher.sync = true
    this.val = 1
    this._watcher.sync = false
    this.val = 2
    this.val = 3
  }
})
```



### vue 开发技巧

##### $on(‘hook:’)

如果要在`created`或`mounted`方法中定义自定义事件侦听器或第三方插件，并且需要在`beforeDestroy`方法中将其删除以免引起任何内存泄漏，则可以使用此功能。 使用`$on(‘hook:’)`方法，我们可以仅使用一种生命周期方法（而不是两种）来定义/删除事件。

```javascript
mounted (){
    const aPlugin = aPlugin(); // 注册
    this.$on('hook:beforeDestroy', () => {
        // 卸载
        aPlugin.destroy();
    })
}
```

##### 动态指令参数

```javascript
<template>
  <div id="app">
    <button @[someEvent]="handleSomeEvent($event)">按钮点击</button>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      someCondition: false 
    };
  },
  computed: {
    someEvent: function() {
      return this.someCondition ? "click" : "dblclick";
    }
  },
  methods: {
    handleSomeEvent(e) {
      // ...
      console.log(e);
    }
  }
};
```



##### 从父类到子类的所有 props

还有一个可以传跨级传递的是 v-bind="$attrs", C组件可以直接获取到A组件中传递下来的props（除了B组件中props声明的。

用于嵌套多层的组件

```javascript
// A组件
 <button-component msg="单击按钮" btnColor="#02ef1f"></button-component>
// B组件
// 一起传给子组件
<a-button v-bind="$props"></a-button>
// C组件
<button :style="{'color': btnColor}">{{msg}}</button>
```



##### 从父类到子类的所有事件侦听器

```javascript
// A组件
<button-component msg="单击按钮" btnColor="#02ef1f" v-on:test1="onTest1"></button-component>
// B组件B
<!-- C组件中能直接触发test1的原因在于,B组件调用三级组件时 使用 v-on 绑定了$listeners 属性 -->
<a-button v-bind="$props" v-on="$listeners"></a-button>
// C组件
mounted() {
  this.$emit("test1", 'a-button');
}
```



### 本地打包dist 放到express上运行

全局安装生成器： npm install -g express-generator

创建项目名称: express myApp

安装依赖包

应用生成器创建完成，把我们dist里边文件放到public文件里边

npm start运行，然后打开浏览器，输入http://localhost:3000,即可看到项目在开发时的效果了



### nvm(node包管理工具)

发现问题来源： primordials is not defined 报错

mac/linux版: [nvm](https://github.com/nvm-sh/nvm)

windows版: [nvm-windows]

根据文档, 先卸载node, 然后删除(e.g. "C:\Users<user>\AppData\Roaming\npm") 路径下的npm, 然后下载nvm-windows, 选安装版nvm-setup.zip下载, 然后安装, 调用nvm命令 会报错 "ERROR open \settings.txt in windows 7"的错误, 参考这个解决方法, cmd里输入setx /m NVM_HOME %APPDATA%\nvm  , 然后重新打开个窗口即可。

 nvm install 12.4.0

nvm list // node 列表

nvm use [node 版本号]

每次切换node 版本都要重新下载node_modules

url: https://blog.csdn.net/zxxzxx23/article/details/103000393



###  函数的防抖/节流

* 相同点：都是为了节约请求资源；

* 不同点：函数防抖是某一段时间内只执行一次，而函数节流是间隔一段时间内执行。

eg:搜索联想可以用到函数防抖, 监听滚动时间可以用到函数节流。

* 没有防抖节流的函数

  ```javascript
  // 模拟Ajax请求
  function ajax(content) {
      console.log(content)
  }
  const inputNode = document.getElementById('unDebounce');
  inputNode.addEventListener('keyup', function(e) {
      ajax(e.target.value)
  })
  ```

  

* 防抖函数

  ```javascript
  // 模拟Ajax请求
  function ajax(content) {
      console.log(content)
  }
  function debounce(fun, delay) {
      return function (args) {
          const _args = args;
          // 清除定时器
          clearTimerout(fun.id);
          fun.id = setTimeout(()=> {
              fun.call(this, _args)
          }, delay)
      }
  }
  const debounceAjax = debounce(ajax, 500);
  const inputNode = document.getElementById('unDebounce');
  inputNode.addEventListener('keyup', function(e) {
      debounceAjax(e.target.value)
  })
  ```

  

* 节流函数

  ```javascript
  const throttle = function () {
      console.log('节流',new Date().Format('HH:mm:ss'))
  }
  setInterval(debounce(throttle,500),1000)
  ```

  