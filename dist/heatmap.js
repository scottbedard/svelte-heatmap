(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.SvelteHeatmap = factory());
}(this, (function () { 'use strict';

function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function destroyEach(iterations) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d();
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.u();
	this._fragment.d();
	this._fragment = this._state = null;
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init(component, options) {
	component.options = options;

	component._observers = { pre: blankObject(), post: blankObject() };
	component._handlers = blankObject();
	component._root = options._root || component;
	component._bind = options._bind;
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	if (this._root._lock) return;
	this._root._lock = true;
	callAll(this._root._beforecreate);
	callAll(this._root._oncreate);
	callAll(this._root._aftercreate);
	this._root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);
	dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
	this._fragment.p(changed, this._state);
	dispatchObservers(this, this._observers.post, changed, this._state, oldState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function _mount(target, anchor) {
	this._fragment.m(target, anchor);
}

function _unmount() {
	this._fragment.u();
}

var proto = {
	destroy: destroy,
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	teardown: destroy,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};

var __cov_gUvPFF6iZO1AWIu38EZuZw = (Function('return this'))();
if (!__cov_gUvPFF6iZO1AWIu38EZuZw.__coverage__) { __cov_gUvPFF6iZO1AWIu38EZuZw.__coverage__ = {}; }
__cov_gUvPFF6iZO1AWIu38EZuZw = __cov_gUvPFF6iZO1AWIu38EZuZw.__coverage__;
if (!(__cov_gUvPFF6iZO1AWIu38EZuZw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js'])) {
   __cov_gUvPFF6iZO1AWIu38EZuZw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js'] = {"path":"c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js","s":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":1,"8":0,"9":0,"10":0},"b":{"1":[0,0],"2":[0,0],"3":[0,0]},"f":{"1":0,"2":0},"fnMap":{"1":{"name":"(anonymous_1)","line":1,"loc":{"start":{"line":1,"column":21},"end":{"line":1,"column":33}}},"2":{"name":"warn","line":67,"loc":{"start":{"line":67,"column":7},"end":{"line":67,"column":26}}}},"statementMap":{"1":{"start":{"line":1,"column":0},"end":{"line":64,"column":4}},"2":{"start":{"line":2,"column":4},"end":{"line":56,"column":53}},"3":{"start":{"line":58,"column":4},"end":{"line":60,"column":5}},"4":{"start":{"line":59,"column":8},"end":{"line":59,"column":30}},"5":{"start":{"line":62,"column":4},"end":{"line":62,"column":29}},"6":{"start":{"line":63,"column":4},"end":{"line":63,"column":41}},"7":{"start":{"line":67,"column":7},"end":{"line":72,"column":1}},"8":{"start":{"line":68,"column":4},"end":{"line":68,"column":26}},"9":{"start":{"line":69,"column":4},"end":{"line":69,"column":26}},"10":{"start":{"line":71,"column":4},"end":{"line":71,"column":43}}},"branchMap":{"1":{"line":56,"type":"binary-expr","locations":[{"start":{"line":56,"column":19},"end":{"line":56,"column":30}},{"start":{"line":56,"column":35},"end":{"line":56,"column":51}}]},"2":{"line":58,"type":"if","locations":[{"start":{"line":58,"column":4},"end":{"line":58,"column":4}},{"start":{"line":58,"column":4},"end":{"line":58,"column":4}}]},"3":{"line":58,"type":"binary-expr","locations":[{"start":{"line":58,"column":8},"end":{"line":58,"column":22}},{"start":{"line":58,"column":26},"end":{"line":58,"column":54}}]}}};
}
__cov_gUvPFF6iZO1AWIu38EZuZw = __cov_gUvPFF6iZO1AWIu38EZuZw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js'];
__cov_gUvPFF6iZO1AWIu38EZuZw.s['1']++;var cov_2avis2pvk8=function(){__cov_gUvPFF6iZO1AWIu38EZuZw.f['1']++;__cov_gUvPFF6iZO1AWIu38EZuZw.s['2']++;var path='c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js',hash='de5bb57f2ca0d456f6a60d4ea42eba400ea3463a',global=new Function('return this')(),gcv='__coverage__',coverageData={path:'c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\log.js',statementMap:{'0':{start:{line:3,column:4},end:{line:3,column:43}}},fnMap:{'0':{name:'warn',decl:{start:{line:2,column:16},end:{line:2,column:20}},loc:{start:{line:2,column:26},end:{line:4,column:1}},line:2}},branchMap:{},s:{'0':0},f:{'0':0},b:{},_coverageSchema:'332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'},coverage=(__cov_gUvPFF6iZO1AWIu38EZuZw.b['1'][0]++, global[gcv])||(__cov_gUvPFF6iZO1AWIu38EZuZw.b['1'][1]++, global[gcv]={});__cov_gUvPFF6iZO1AWIu38EZuZw.s['3']++;if((__cov_gUvPFF6iZO1AWIu38EZuZw.b['3'][0]++, coverage[path])&&(__cov_gUvPFF6iZO1AWIu38EZuZw.b['3'][1]++, coverage[path].hash===hash)){__cov_gUvPFF6iZO1AWIu38EZuZw.b['2'][0]++;__cov_gUvPFF6iZO1AWIu38EZuZw.s['4']++;return coverage[path];}else{__cov_gUvPFF6iZO1AWIu38EZuZw.b['2'][1]++;}__cov_gUvPFF6iZO1AWIu38EZuZw.s['5']++;coverageData.hash=hash;__cov_gUvPFF6iZO1AWIu38EZuZw.s['6']++;return coverage[path]=coverageData;}();function warn(msg){__cov_gUvPFF6iZO1AWIu38EZuZw.f['2']++;__cov_gUvPFF6iZO1AWIu38EZuZw.s['8']++;cov_2avis2pvk8.f[0]++;__cov_gUvPFF6iZO1AWIu38EZuZw.s['9']++;cov_2avis2pvk8.s[0]++;__cov_gUvPFF6iZO1AWIu38EZuZw.s['10']++;console.warn('[SvelteHeatmap] '+msg);}

var __cov_alEcibnYreMn_7OtelbhMw = (Function('return this'))();
if (!__cov_alEcibnYreMn_7OtelbhMw.__coverage__) { __cov_alEcibnYreMn_7OtelbhMw.__coverage__ = {}; }
__cov_alEcibnYreMn_7OtelbhMw = __cov_alEcibnYreMn_7OtelbhMw.__coverage__;
if (!(__cov_alEcibnYreMn_7OtelbhMw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js'])) {
   __cov_alEcibnYreMn_7OtelbhMw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js'] = {"path":"c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js","s":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":1,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":1,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":1,"37":0,"38":0,"39":0,"40":0,"41":0,"42":1,"43":0,"44":0,"45":0},"b":{"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0]},"f":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0},"fnMap":{"1":{"name":"(anonymous_1)","line":1,"loc":{"start":{"line":1,"column":21},"end":{"line":1,"column":33}}},"2":{"name":"normalize","line":358,"loc":{"start":{"line":358,"column":7},"end":{"line":358,"column":35}}},"3":{"name":"(anonymous_3)","line":370,"loc":{"start":{"line":370,"column":33},"end":{"line":370,"column":49}}},"4":{"name":"fillMissingDates","line":378,"loc":{"start":{"line":378,"column":0},"end":{"line":378,"column":52}}},"5":{"name":"attachDayOfWeek","line":415,"loc":{"start":{"line":415,"column":0},"end":{"line":415,"column":31}}},"6":{"name":"getDateString","line":426,"loc":{"start":{"line":426,"column":0},"end":{"line":426,"column":29}}}},"statementMap":{"1":{"start":{"line":1,"column":0},"end":{"line":354,"column":4}},"2":{"start":{"line":2,"column":4},"end":{"line":346,"column":53}},"3":{"start":{"line":348,"column":4},"end":{"line":350,"column":5}},"4":{"start":{"line":349,"column":8},"end":{"line":349,"column":30}},"5":{"start":{"line":352,"column":4},"end":{"line":352,"column":29}},"6":{"start":{"line":353,"column":4},"end":{"line":353,"column":41}},"7":{"start":{"line":358,"column":7},"end":{"line":375,"column":1}},"8":{"start":{"line":359,"column":4},"end":{"line":359,"column":26}},"9":{"start":{"line":360,"column":4},"end":{"line":360,"column":26}},"10":{"start":{"line":370,"column":4},"end":{"line":374,"column":57}},"11":{"start":{"line":371,"column":8},"end":{"line":371,"column":30}},"12":{"start":{"line":372,"column":8},"end":{"line":372,"column":30}},"13":{"start":{"line":373,"column":8},"end":{"line":373,"column":31}},"14":{"start":{"line":378,"column":0},"end":{"line":412,"column":1}},"15":{"start":{"line":379,"column":4},"end":{"line":379,"column":26}},"16":{"start":{"line":380,"column":4},"end":{"line":380,"column":26}},"17":{"start":{"line":383,"column":4},"end":{"line":383,"column":22}},"18":{"start":{"line":386,"column":4},"end":{"line":386,"column":55}},"19":{"start":{"line":388,"column":4},"end":{"line":388,"column":26}},"20":{"start":{"line":389,"column":4},"end":{"line":408,"column":5}},"21":{"start":{"line":390,"column":8},"end":{"line":390,"column":33}},"22":{"start":{"line":392,"column":8},"end":{"line":392,"column":71}},"23":{"start":{"line":393,"column":8},"end":{"line":393,"column":30}},"24":{"start":{"line":394,"column":8},"end":{"line":394,"column":49}},"25":{"start":{"line":396,"column":8},"end":{"line":396,"column":30}},"26":{"start":{"line":397,"column":8},"end":{"line":405,"column":9}},"27":{"start":{"line":398,"column":12},"end":{"line":398,"column":34}},"28":{"start":{"line":400,"column":12},"end":{"line":400,"column":72}},"29":{"start":{"line":401,"column":12},"end":{"line":401,"column":34}},"30":{"start":{"line":402,"column":12},"end":{"line":402,"column":69}},"31":{"start":{"line":403,"column":12},"end":{"line":403,"column":35}},"32":{"start":{"line":404,"column":12},"end":{"line":404,"column":53}},"33":{"start":{"line":407,"column":8},"end":{"line":407,"column":33}},"34":{"start":{"line":410,"column":4},"end":{"line":410,"column":27}},"35":{"start":{"line":411,"column":4},"end":{"line":411,"column":15}},"36":{"start":{"line":415,"column":0},"end":{"line":423,"column":1}},"37":{"start":{"line":416,"column":4},"end":{"line":417,"column":27}},"38":{"start":{"line":418,"column":4},"end":{"line":418,"column":26}},"39":{"start":{"line":420,"column":4},"end":{"line":420,"column":64}},"40":{"start":{"line":421,"column":4},"end":{"line":421,"column":27}},"41":{"start":{"line":422,"column":4},"end":{"line":422,"column":50}},"42":{"start":{"line":426,"column":0},"end":{"line":431,"column":1}},"43":{"start":{"line":427,"column":4},"end":{"line":427,"column":26}},"44":{"start":{"line":428,"column":4},"end":{"line":428,"column":27}},"45":{"start":{"line":430,"column":4},"end":{"line":430,"column":62}}},"branchMap":{"1":{"line":346,"type":"binary-expr","locations":[{"start":{"line":346,"column":19},"end":{"line":346,"column":30}},{"start":{"line":346,"column":35},"end":{"line":346,"column":51}}]},"2":{"line":348,"type":"if","locations":[{"start":{"line":348,"column":4},"end":{"line":348,"column":4}},{"start":{"line":348,"column":4},"end":{"line":348,"column":4}}]},"3":{"line":348,"type":"binary-expr","locations":[{"start":{"line":348,"column":8},"end":{"line":348,"column":22}},{"start":{"line":348,"column":26},"end":{"line":348,"column":54}}]},"4":{"line":389,"type":"if","locations":[{"start":{"line":389,"column":4},"end":{"line":389,"column":4}},{"start":{"line":389,"column":4},"end":{"line":389,"column":4}}]}}};
}
__cov_alEcibnYreMn_7OtelbhMw = __cov_alEcibnYreMn_7OtelbhMw['c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js'];
__cov_alEcibnYreMn_7OtelbhMw.s['1']++;var cov_2fek279ofk=function(){__cov_alEcibnYreMn_7OtelbhMw.f['1']++;__cov_alEcibnYreMn_7OtelbhMw.s['2']++;var path='c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js',hash='c9b2567a9501aee33258422544c9d6ca17507961',global=new Function('return this')(),gcv='__coverage__',coverageData={path:'c:\\wamp64\\www\\svelte-heatmap\\src\\utils\\history.js',statementMap:{'0':{start:{line:12,column:4},end:{line:15,column:30}},'1':{start:{line:13,column:24},end:{line:13,column:39}},'2':{start:{line:21,column:4},end:{line:21,column:22}},'3':{start:{line:24,column:17},end:{line:24,column:31}},'4':{start:{line:26,column:4},end:{line:35,column:5}},'5':{start:{line:27,column:23},end:{line:27,column:45}},'6':{start:{line:28,column:8},end:{line:28,column:49}},'7':{start:{line:30,column:8},end:{line:34,column:9}},'8':{start:{line:31,column:12},end:{line:31,column:72}},'9':{start:{line:32,column:12},end:{line:32,column:69}},'10':{start:{line:33,column:12},end:{line:33,column:53}},'11':{start:{line:37,column:4},end:{line:37,column:15}},'12':{start:{line:42,column:16},end:{line:42,column:39}},'13':{start:{line:43,column:4},end:{line:43,column:32}},'14':{start:{line:48,column:4},end:{line:48,column:62}}},fnMap:{'0':{name:'normalize',decl:{start:{line:3,column:16},end:{line:3,column:25}},loc:{start:{line:3,column:35},end:{line:16,column:1}},line:3},'1':{name:'(anonymous_1)',decl:{start:{line:13,column:14},end:{line:13,column:15}},loc:{start:{line:13,column:24},end:{line:13,column:39}},line:13},'2':{name:'fillMissingDates',decl:{start:{line:19,column:9},end:{line:19,column:25}},loc:{start:{line:19,column:52},end:{line:38,column:1}},line:19},'3':{name:'attachDayOfWeek',decl:{start:{line:41,column:9},end:{line:41,column:24}},loc:{start:{line:41,column:42},end:{line:44,column:1}},line:41},'4':{name:'getDateString',decl:{start:{line:47,column:9},end:{line:47,column:22}},loc:{start:{line:47,column:29},end:{line:49,column:1}},line:47}},branchMap:{'0':{loc:{start:{line:26,column:4},end:{line:35,column:5}},type:'if',locations:[{start:{line:26,column:4},end:{line:35,column:5}},{start:{line:26,column:4},end:{line:35,column:5}}],line:26}},s:{'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,'11':0,'12':0,'13':0,'14':0},f:{'0':0,'1':0,'2':0,'3':0,'4':0},b:{'0':[0,0]},_coverageSchema:'332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'},coverage=(__cov_alEcibnYreMn_7OtelbhMw.b['1'][0]++, global[gcv])||(__cov_alEcibnYreMn_7OtelbhMw.b['1'][1]++, global[gcv]={});__cov_alEcibnYreMn_7OtelbhMw.s['3']++;if((__cov_alEcibnYreMn_7OtelbhMw.b['3'][0]++, coverage[path])&&(__cov_alEcibnYreMn_7OtelbhMw.b['3'][1]++, coverage[path].hash===hash)){__cov_alEcibnYreMn_7OtelbhMw.b['2'][0]++;__cov_alEcibnYreMn_7OtelbhMw.s['4']++;return coverage[path];}else{__cov_alEcibnYreMn_7OtelbhMw.b['2'][1]++;}__cov_alEcibnYreMn_7OtelbhMw.s['5']++;coverageData.hash=hash;__cov_alEcibnYreMn_7OtelbhMw.s['6']++;return coverage[path]=coverageData;}();function normalize(history){__cov_alEcibnYreMn_7OtelbhMw.f['2']++;__cov_alEcibnYreMn_7OtelbhMw.s['8']++;cov_2fek279ofk.f[0]++;__cov_alEcibnYreMn_7OtelbhMw.s['9']++;cov_2fek279ofk.s[0]++;__cov_alEcibnYreMn_7OtelbhMw.s['10']++;return history.slice(0).sort(function(a,b){__cov_alEcibnYreMn_7OtelbhMw.f['3']++;__cov_alEcibnYreMn_7OtelbhMw.s['11']++;cov_2fek279ofk.f[1]++;__cov_alEcibnYreMn_7OtelbhMw.s['12']++;cov_2fek279ofk.s[1]++;__cov_alEcibnYreMn_7OtelbhMw.s['13']++;return a.date>b.date;}).reduce(fillMissingDates,[]).map(attachDayOfWeek);}function fillMissingDates(arr,current,i,history){__cov_alEcibnYreMn_7OtelbhMw.f['4']++;__cov_alEcibnYreMn_7OtelbhMw.s['15']++;cov_2fek279ofk.f[2]++;__cov_alEcibnYreMn_7OtelbhMw.s['16']++;cov_2fek279ofk.s[2]++;__cov_alEcibnYreMn_7OtelbhMw.s['17']++;arr.push(current);__cov_alEcibnYreMn_7OtelbhMw.s['18']++;var next=(cov_2fek279ofk.s[3]++, history[i+1]);__cov_alEcibnYreMn_7OtelbhMw.s['19']++;cov_2fek279ofk.s[4]++;__cov_alEcibnYreMn_7OtelbhMw.s['20']++;if(next){__cov_alEcibnYreMn_7OtelbhMw.b['4'][0]++;__cov_alEcibnYreMn_7OtelbhMw.s['21']++;cov_2fek279ofk.b[0][0]++;__cov_alEcibnYreMn_7OtelbhMw.s['22']++;var tomorrow=(cov_2fek279ofk.s[5]++, new Date(current.date));__cov_alEcibnYreMn_7OtelbhMw.s['23']++;cov_2fek279ofk.s[6]++;__cov_alEcibnYreMn_7OtelbhMw.s['24']++;tomorrow.setDate(tomorrow.getDate()+1);__cov_alEcibnYreMn_7OtelbhMw.s['25']++;cov_2fek279ofk.s[7]++;__cov_alEcibnYreMn_7OtelbhMw.s['26']++;while(getDateString(tomorrow)<next.date){__cov_alEcibnYreMn_7OtelbhMw.s['27']++;cov_2fek279ofk.s[8]++;__cov_alEcibnYreMn_7OtelbhMw.s['28']++;console.log('doing it',getDateString(tomorrow),next.date);__cov_alEcibnYreMn_7OtelbhMw.s['29']++;cov_2fek279ofk.s[9]++;__cov_alEcibnYreMn_7OtelbhMw.s['30']++;arr.push({date:getDateString(tomorrow),value:null});__cov_alEcibnYreMn_7OtelbhMw.s['31']++;cov_2fek279ofk.s[10]++;__cov_alEcibnYreMn_7OtelbhMw.s['32']++;tomorrow.setDate(tomorrow.getDate()+1);}}else{__cov_alEcibnYreMn_7OtelbhMw.b['4'][1]++;__cov_alEcibnYreMn_7OtelbhMw.s['33']++;cov_2fek279ofk.b[0][1]++;}__cov_alEcibnYreMn_7OtelbhMw.s['34']++;cov_2fek279ofk.s[11]++;__cov_alEcibnYreMn_7OtelbhMw.s['35']++;return arr;}function attachDayOfWeek(_ref){__cov_alEcibnYreMn_7OtelbhMw.f['5']++;__cov_alEcibnYreMn_7OtelbhMw.s['37']++;var date=_ref.date,value=_ref.value;__cov_alEcibnYreMn_7OtelbhMw.s['38']++;cov_2fek279ofk.f[3]++;__cov_alEcibnYreMn_7OtelbhMw.s['39']++;var day=(cov_2fek279ofk.s[12]++, new Date(date).getDay());__cov_alEcibnYreMn_7OtelbhMw.s['40']++;cov_2fek279ofk.s[13]++;__cov_alEcibnYreMn_7OtelbhMw.s['41']++;return{date:date,day:day,value:value};}function getDateString(date){__cov_alEcibnYreMn_7OtelbhMw.f['6']++;__cov_alEcibnYreMn_7OtelbhMw.s['43']++;cov_2fek279ofk.f[4]++;__cov_alEcibnYreMn_7OtelbhMw.s['44']++;cov_2fek279ofk.s[14]++;__cov_alEcibnYreMn_7OtelbhMw.s['45']++;return date.toISOString().slice(0,10).replace(/-/g,'/');}

var __cov_eH8GtDE1U$cF$XOtVgJrUw = (Function('return this'))();
if (!__cov_eH8GtDE1U$cF$XOtVgJrUw.__coverage__) { __cov_eH8GtDE1U$cF$XOtVgJrUw.__coverage__ = {}; }
__cov_eH8GtDE1U$cF$XOtVgJrUw = __cov_eH8GtDE1U$cF$XOtVgJrUw.__coverage__;
if (!(__cov_eH8GtDE1U$cF$XOtVgJrUw['c:\\wamp64\\www\\svelte-heatmap\\src\\heatmap.html'])) {
   __cov_eH8GtDE1U$cF$XOtVgJrUw['c:\\wamp64\\www\\svelte-heatmap\\src\\heatmap.html'] = {"path":"c:\\wamp64\\www\\svelte-heatmap\\src\\heatmap.html","s":{"1":1,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":1,"23":0,"24":1,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":0,"52":0,"53":0,"54":0,"55":0,"56":0,"57":0,"58":1,"59":0,"60":0,"61":0,"62":0,"63":0,"64":0,"65":0,"66":0,"67":0,"68":1,"69":0,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":0,"78":0,"79":0,"80":0,"81":0,"82":0,"83":0,"84":0,"85":0},"b":{"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0],"15":[0,0,0],"16":[0,0],"17":[0,0],"18":[0,0],"19":[0,0],"20":[0,0],"21":[0,0]},"f":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0},"fnMap":{"1":{"name":"normalizedHistory","line":6,"loc":{"start":{"line":6,"column":0},"end":{"line":6,"column":36}}},"2":{"name":"(anonymous_2)","line":11,"loc":{"start":{"line":11,"column":19},"end":{"line":11,"column":22}}},"3":{"name":"oncreate","line":53,"loc":{"start":{"line":53,"column":0},"end":{"line":53,"column":20}}},"4":{"name":"create_main_fragment","line":57,"loc":{"start":{"line":57,"column":0},"end":{"line":57,"column":48}}},"5":{"name":"create","line":69,"loc":{"start":{"line":69,"column":5},"end":{"line":69,"column":23}}},"6":{"name":"mount","line":80,"loc":{"start":{"line":80,"column":5},"end":{"line":80,"column":36}}},"7":{"name":"update","line":90,"loc":{"start":{"line":90,"column":5},"end":{"line":90,"column":37}}},"8":{"name":"unmount","line":112,"loc":{"start":{"line":112,"column":5},"end":{"line":112,"column":24}}},"9":{"name":"destroy","line":120,"loc":{"start":{"line":120,"column":5},"end":{"line":120,"column":24}}},"10":{"name":"create_each_block","line":127,"loc":{"start":{"line":127,"column":0},"end":{"line":127,"column":84}}},"11":{"name":"create","line":131,"loc":{"start":{"line":131,"column":5},"end":{"line":131,"column":23}}},"12":{"name":"mount","line":136,"loc":{"start":{"line":136,"column":5},"end":{"line":136,"column":36}}},"13":{"name":"update","line":141,"loc":{"start":{"line":141,"column":5},"end":{"line":141,"column":76}}},"14":{"name":"unmount","line":147,"loc":{"start":{"line":147,"column":5},"end":{"line":147,"column":24}}},"15":{"name":"Heatmap","line":155,"loc":{"start":{"line":155,"column":0},"end":{"line":155,"column":26}}},"16":{"name":"_recompute","line":180,"loc":{"start":{"line":180,"column":31},"end":{"line":180,"column":67}}}},"statementMap":{"1":{"start":{"line":6,"column":0},"end":{"line":8,"column":1}},"2":{"start":{"line":7,"column":1},"end":{"line":7,"column":33}},"3":{"start":{"line":10,"column":0},"end":{"line":51,"column":2}},"4":{"start":{"line":12,"column":8},"end":{"line":12,"column":44}},"5":{"start":{"line":15,"column":8},"end":{"line":18,"column":9}},"6":{"start":{"line":16,"column":12},"end":{"line":16,"column":53}},"7":{"start":{"line":17,"column":12},"end":{"line":17,"column":25}},"8":{"start":{"line":21,"column":8},"end":{"line":24,"column":9}},"9":{"start":{"line":22,"column":12},"end":{"line":22,"column":46}},"10":{"start":{"line":23,"column":12},"end":{"line":23,"column":25}},"11":{"start":{"line":27,"column":8},"end":{"line":46,"column":9}},"12":{"start":{"line":30,"column":12},"end":{"line":33,"column":13}},"13":{"start":{"line":31,"column":16},"end":{"line":31,"column":94}},"14":{"start":{"line":32,"column":16},"end":{"line":32,"column":29}},"15":{"start":{"line":36,"column":12},"end":{"line":39,"column":13}},"16":{"start":{"line":37,"column":16},"end":{"line":37,"column":92}},"17":{"start":{"line":38,"column":16},"end":{"line":38,"column":29}},"18":{"start":{"line":42,"column":12},"end":{"line":45,"column":13}},"19":{"start":{"line":43,"column":16},"end":{"line":43,"column":92}},"20":{"start":{"line":44,"column":16},"end":{"line":44,"column":29}},"21":{"start":{"line":49,"column":8},"end":{"line":49,"column":20}},"22":{"start":{"line":53,"column":0},"end":{"line":55,"column":1}},"23":{"start":{"line":54,"column":4},"end":{"line":54,"column":27}},"24":{"start":{"line":57,"column":0},"end":{"line":124,"column":1}},"25":{"start":{"line":58,"column":1},"end":{"line":58,"column":21}},"26":{"start":{"line":60,"column":1},"end":{"line":60,"column":51}},"27":{"start":{"line":62,"column":1},"end":{"line":62,"column":22}},"28":{"start":{"line":64,"column":1},"end":{"line":66,"column":2}},"29":{"start":{"line":65,"column":2},"end":{"line":65,"column":103}},"30":{"start":{"line":68,"column":1},"end":{"line":123,"column":3}},"31":{"start":{"line":70,"column":3},"end":{"line":70,"column":30}},"32":{"start":{"line":71,"column":3},"end":{"line":71,"column":28}},"33":{"start":{"line":72,"column":3},"end":{"line":72,"column":37}},"34":{"start":{"line":73,"column":3},"end":{"line":73,"column":35}},"35":{"start":{"line":75,"column":3},"end":{"line":77,"column":4}},"36":{"start":{"line":76,"column":4},"end":{"line":76,"column":23}},"37":{"start":{"line":81,"column":3},"end":{"line":81,"column":35}},"38":{"start":{"line":82,"column":3},"end":{"line":82,"column":23}},"39":{"start":{"line":83,"column":3},"end":{"line":83,"column":27}},"40":{"start":{"line":85,"column":3},"end":{"line":87,"column":4}},"41":{"start":{"line":86,"column":4},"end":{"line":86,"column":32}},"42":{"start":{"line":91,"column":3},"end":{"line":91,"column":53}},"43":{"start":{"line":93,"column":3},"end":{"line":109,"column":4}},"44":{"start":{"line":94,"column":4},"end":{"line":102,"column":5}},"45":{"start":{"line":95,"column":5},"end":{"line":101,"column":6}},"46":{"start":{"line":96,"column":6},"end":{"line":96,"column":87}},"47":{"start":{"line":98,"column":6},"end":{"line":98,"column":107}},"48":{"start":{"line":99,"column":6},"end":{"line":99,"column":25}},"49":{"start":{"line":100,"column":6},"end":{"line":100,"column":34}},"50":{"start":{"line":104,"column":4},"end":{"line":107,"column":5}},"51":{"start":{"line":105,"column":5},"end":{"line":105,"column":24}},"52":{"start":{"line":106,"column":5},"end":{"line":106,"column":24}},"53":{"start":{"line":108,"column":4},"end":{"line":108,"column":52}},"54":{"start":{"line":113,"column":3},"end":{"line":113,"column":19}},"55":{"start":{"line":115,"column":3},"end":{"line":117,"column":4}},"56":{"start":{"line":116,"column":4},"end":{"line":116,"column":23}},"57":{"start":{"line":121,"column":3},"end":{"line":121,"column":28}},"58":{"start":{"line":127,"column":0},"end":{"line":153,"column":1}},"59":{"start":{"line":128,"column":1},"end":{"line":128,"column":83}},"60":{"start":{"line":130,"column":1},"end":{"line":152,"column":3}},"61":{"start":{"line":132,"column":3},"end":{"line":132,"column":30}},"62":{"start":{"line":133,"column":3},"end":{"line":133,"column":33}},"63":{"start":{"line":137,"column":3},"end":{"line":137,"column":35}},"64":{"start":{"line":138,"column":3},"end":{"line":138,"column":25}},"65":{"start":{"line":142,"column":3},"end":{"line":144,"column":4}},"66":{"start":{"line":143,"column":4},"end":{"line":143,"column":27}},"67":{"start":{"line":148,"column":3},"end":{"line":148,"column":19}},"68":{"start":{"line":155,"column":0},"end":{"line":176,"column":1}},"69":{"start":{"line":156,"column":1},"end":{"line":156,"column":21}},"70":{"start":{"line":157,"column":1},"end":{"line":157,"column":40}},"71":{"start":{"line":158,"column":1},"end":{"line":158,"column":46}},"72":{"start":{"line":160,"column":1},"end":{"line":160,"column":37}},"73":{"start":{"line":162,"column":1},"end":{"line":166,"column":3}},"74":{"start":{"line":163,"column":2},"end":{"line":163,"column":31}},"75":{"start":{"line":165,"column":3},"end":{"line":165,"column":40}},"76":{"start":{"line":168,"column":1},"end":{"line":168,"column":58}},"77":{"start":{"line":170,"column":1},"end":{"line":175,"column":2}},"78":{"start":{"line":171,"column":2},"end":{"line":171,"column":21}},"79":{"start":{"line":172,"column":2},"end":{"line":172,"column":59}},"80":{"start":{"line":174,"column":2},"end":{"line":174,"column":26}},"81":{"start":{"line":178,"column":0},"end":{"line":178,"column":42}},"82":{"start":{"line":180,"column":0},"end":{"line":184,"column":1}},"83":{"start":{"line":181,"column":1},"end":{"line":183,"column":2}},"84":{"start":{"line":182,"column":2},"end":{"line":182,"column":135}},"85":{"start":{"line":182,"column":102},"end":{"line":182,"column":135}}},"branchMap":{"1":{"line":7,"type":"binary-expr","locations":[{"start":{"line":7,"column":18},"end":{"line":7,"column":25}},{"start":{"line":7,"column":29},"end":{"line":7,"column":31}}]},"2":{"line":15,"type":"if","locations":[{"start":{"line":15,"column":8},"end":{"line":15,"column":8}},{"start":{"line":15,"column":8},"end":{"line":15,"column":8}}]},"3":{"line":21,"type":"if","locations":[{"start":{"line":21,"column":8},"end":{"line":21,"column":8}},{"start":{"line":21,"column":8},"end":{"line":21,"column":8}}]},"4":{"line":30,"type":"if","locations":[{"start":{"line":30,"column":12},"end":{"line":30,"column":12}},{"start":{"line":30,"column":12},"end":{"line":30,"column":12}}]},"5":{"line":30,"type":"binary-expr","locations":[{"start":{"line":30,"column":16},"end":{"line":30,"column":40}},{"start":{"line":30,"column":44},"end":{"line":30,"column":63}}]},"6":{"line":36,"type":"if","locations":[{"start":{"line":36,"column":12},"end":{"line":36,"column":12}},{"start":{"line":36,"column":12},"end":{"line":36,"column":12}}]},"7":{"line":36,"type":"binary-expr","locations":[{"start":{"line":36,"column":16},"end":{"line":36,"column":45}},{"start":{"line":36,"column":49},"end":{"line":36,"column":90}}]},"8":{"line":42,"type":"if","locations":[{"start":{"line":42,"column":12},"end":{"line":42,"column":12}},{"start":{"line":42,"column":12},"end":{"line":42,"column":12}}]},"9":{"line":42,"type":"binary-expr","locations":[{"start":{"line":42,"column":16},"end":{"line":42,"column":46}},{"start":{"line":42,"column":50},"end":{"line":42,"column":64}},{"start":{"line":42,"column":68},"end":{"line":42,"column":91}}]},"10":{"line":93,"type":"if","locations":[{"start":{"line":93,"column":3},"end":{"line":93,"column":3}},{"start":{"line":93,"column":3},"end":{"line":93,"column":3}}]},"11":{"line":93,"type":"binary-expr","locations":[{"start":{"line":93,"column":7},"end":{"line":93,"column":19}},{"start":{"line":93,"column":23},"end":{"line":93,"column":48}}]},"12":{"line":95,"type":"if","locations":[{"start":{"line":95,"column":5},"end":{"line":95,"column":5}},{"start":{"line":95,"column":5},"end":{"line":95,"column":5}}]},"13":{"line":128,"type":"cond-expr","locations":[{"start":{"line":128,"column":42},"end":{"line":128,"column":52}},{"start":{"line":128,"column":55},"end":{"line":128,"column":59}}]},"14":{"line":142,"type":"if","locations":[{"start":{"line":142,"column":3},"end":{"line":142,"column":3}},{"start":{"line":142,"column":3},"end":{"line":142,"column":3}}]},"15":{"line":142,"type":"binary-expr","locations":[{"start":{"line":142,"column":8},"end":{"line":142,"column":20}},{"start":{"line":142,"column":24},"end":{"line":142,"column":49}},{"start":{"line":142,"column":54},"end":{"line":142,"column":137}}]},"16":{"line":142,"type":"cond-expr","locations":[{"start":{"line":142,"column":102},"end":{"line":142,"column":112}},{"start":{"line":142,"column":115},"end":{"line":142,"column":119}}]},"17":{"line":162,"type":"if","locations":[{"start":{"line":162,"column":1},"end":{"line":162,"column":1}},{"start":{"line":162,"column":1},"end":{"line":162,"column":1}}]},"18":{"line":170,"type":"if","locations":[{"start":{"line":170,"column":1},"end":{"line":170,"column":1}},{"start":{"line":170,"column":1},"end":{"line":170,"column":1}}]},"19":{"line":172,"type":"binary-expr","locations":[{"start":{"line":172,"column":35},"end":{"line":172,"column":49}},{"start":{"line":172,"column":53},"end":{"line":172,"column":57}}]},"20":{"line":181,"type":"if","locations":[{"start":{"line":181,"column":1},"end":{"line":181,"column":1}},{"start":{"line":181,"column":1},"end":{"line":181,"column":1}}]},"21":{"line":182,"type":"if","locations":[{"start":{"line":182,"column":2},"end":{"line":182,"column":2}},{"start":{"line":182,"column":2},"end":{"line":182,"column":2}}]}}};
}
__cov_eH8GtDE1U$cF$XOtVgJrUw = __cov_eH8GtDE1U$cF$XOtVgJrUw['c:\\wamp64\\www\\svelte-heatmap\\src\\heatmap.html'];
function normalizedHistory(history){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['1']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['2']++;return normalize((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['1'][0]++, history)||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['1'][1]++, []));}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['3']++;var methods={validateHistory(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['2']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['4']++;const history=this.get('history');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['5']++;if(typeof history==='undefined'){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['2'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['6']++;warn('Missing required "history" prop.');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['7']++;return false;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['2'][1]++;}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['8']++;if(!Array.isArray(history)){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['3'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['9']++;warn('History must be an array.');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['10']++;return false;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['3'][1]++;}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['11']++;for(let item of history){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['12']++;if((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['5'][0]++, typeof item!=='object')||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['5'][1]++, Array.isArray(item))){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['4'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['13']++;warn('All history items must be objects with "date" and "value" properties.');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['14']++;return false;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['4'][1]++;}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['15']++;if((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['7'][0]++, typeof item.date!=='string')||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['7'][1]++, !item.date.match(/^\d{4}\/\d{2}\/\d{2}$/))){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['6'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['16']++;warn(`Invalid history date. Expected YYYY/MM/DD string, got ${item.date}.`);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['17']++;return false;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['6'][1]++;}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['18']++;if((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['9'][0]++, typeof item.value!=='number')||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['9'][1]++, item.value<0)||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['9'][2]++, item.value===Infinity)){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['8'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['19']++;warn(`Invalid history value. Expected positive number, got ${item.value}.`);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['20']++;return false;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['8'][1]++;}}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['21']++;return true;}};function oncreate(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['3']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['23']++;this.validateHistory();}function create_main_fragment(state,component){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['4']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['25']++;var div,h1,text_1;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['26']++;var normalizedHistory_1=state.normalizedHistory;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['27']++;var each_blocks=[];__cov_eH8GtDE1U$cF$XOtVgJrUw.s['28']++;for(var i=0;i<normalizedHistory_1.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['29']++;each_blocks[i]=create_each_block(state,normalizedHistory_1,normalizedHistory_1[i],i,component);}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['30']++;return{c:function create(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['5']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['31']++;div=createElement('div');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['32']++;h1=createElement('h1');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['33']++;h1.textContent='svelte-heatmap';__cov_eH8GtDE1U$cF$XOtVgJrUw.s['34']++;text_1=createText('\r\n    ');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['35']++;for(var i=0;i<each_blocks.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['36']++;each_blocks[i].c();}},m:function mount(target,anchor){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['6']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['37']++;insertNode(div,target,anchor);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['38']++;appendNode(h1,div);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['39']++;appendNode(text_1,div);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['40']++;for(var i=0;i<each_blocks.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['41']++;each_blocks[i].m(div,null);}},p:function update(changed,state){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['7']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['42']++;var normalizedHistory_1=state.normalizedHistory;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['43']++;if((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['11'][0]++, changed.JSON)||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['11'][1]++, changed.normalizedHistory)){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['10'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['44']++;for(var i=0;i<normalizedHistory_1.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['45']++;if(each_blocks[i]){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['12'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['46']++;each_blocks[i].p(changed,state,normalizedHistory_1,normalizedHistory_1[i],i);}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['12'][1]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['47']++;each_blocks[i]=create_each_block(state,normalizedHistory_1,normalizedHistory_1[i],i,component);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['48']++;each_blocks[i].c();__cov_eH8GtDE1U$cF$XOtVgJrUw.s['49']++;each_blocks[i].m(div,null);}}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['50']++;for(;i<each_blocks.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['51']++;each_blocks[i].u();__cov_eH8GtDE1U$cF$XOtVgJrUw.s['52']++;each_blocks[i].d();}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['53']++;each_blocks.length=normalizedHistory_1.length;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['10'][1]++;}},u:function unmount(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['8']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['54']++;detachNode(div);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['55']++;for(var i=0;i<each_blocks.length;i+=1){__cov_eH8GtDE1U$cF$XOtVgJrUw.s['56']++;each_blocks[i].u();}},d:function destroy$$1(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['9']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['57']++;destroyEach(each_blocks);}};}function create_each_block(state,normalizedHistory_1,date,date_index,component){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['10']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['59']++;var pre,text_value=('JSON'in state?(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['13'][0]++, state.JSON):(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['13'][1]++, JSON)).stringify(date),text;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['60']++;return{c:function create(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['11']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['61']++;pre=createElement('pre');__cov_eH8GtDE1U$cF$XOtVgJrUw.s['62']++;text=createText(text_value);},m:function mount(target,anchor){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['12']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['63']++;insertNode(pre,target,anchor);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['64']++;appendNode(text,pre);},p:function update(changed,state,normalizedHistory_1,date,date_index){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['13']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['65']++;if(((__cov_eH8GtDE1U$cF$XOtVgJrUw.b['15'][0]++, changed.JSON)||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['15'][1]++, changed.normalizedHistory))&&(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['15'][2]++, text_value!==(text_value=('JSON'in state?(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['16'][0]++, state.JSON):(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['16'][1]++, JSON)).stringify(date)))){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['14'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['66']++;text.data=text_value;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['14'][1]++;}},u:function unmount(){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['14']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['67']++;detachNode(pre);},d:noop};}function Heatmap$1(options){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['15']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['69']++;init(this,options);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['70']++;this._state=assign({},options.data);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['71']++;this._recompute({history:1},this._state);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['72']++;var _oncreate=oncreate.bind(this);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['73']++;if(!options._root){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['17'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['74']++;this._oncreate=[_oncreate];}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['17'][1]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['75']++;this._root._oncreate.push(_oncreate);}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['76']++;this._fragment=create_main_fragment(this._state,this);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['77']++;if(options.target){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['18'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['78']++;this._fragment.c();__cov_eH8GtDE1U$cF$XOtVgJrUw.s['79']++;this._fragment.m(options.target,(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['19'][0]++, options.anchor)||(__cov_eH8GtDE1U$cF$XOtVgJrUw.b['19'][1]++, null));__cov_eH8GtDE1U$cF$XOtVgJrUw.s['80']++;callAll(this._oncreate);}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['18'][1]++;}}__cov_eH8GtDE1U$cF$XOtVgJrUw.s['81']++;assign(Heatmap$1.prototype,methods,proto);__cov_eH8GtDE1U$cF$XOtVgJrUw.s['82']++;Heatmap$1.prototype._recompute=function _recompute(changed,state){__cov_eH8GtDE1U$cF$XOtVgJrUw.f['16']++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['83']++;if(changed.history){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['20'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['84']++;if(differs(state.normalizedHistory,state.normalizedHistory=normalizedHistory(state.history))){__cov_eH8GtDE1U$cF$XOtVgJrUw.b['21'][0]++;__cov_eH8GtDE1U$cF$XOtVgJrUw.s['85']++;changed.normalizedHistory=true;}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['21'][1]++;}}else{__cov_eH8GtDE1U$cF$XOtVgJrUw.b['20'][1]++;}};

var __cov_MFGraHnOZpFWrd0GJ15vEw = (Function('return this'))();
if (!__cov_MFGraHnOZpFWrd0GJ15vEw.__coverage__) { __cov_MFGraHnOZpFWrd0GJ15vEw.__coverage__ = {}; }
__cov_MFGraHnOZpFWrd0GJ15vEw = __cov_MFGraHnOZpFWrd0GJ15vEw.__coverage__;
if (!(__cov_MFGraHnOZpFWrd0GJ15vEw['c:\\wamp64\\www\\svelte-heatmap\\src\\main.js'])) {
   __cov_MFGraHnOZpFWrd0GJ15vEw['c:\\wamp64\\www\\svelte-heatmap\\src\\main.js'] = {"path":"c:\\wamp64\\www\\svelte-heatmap\\src\\main.js","s":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0},"b":{"1":[0,0],"2":[0,0],"3":[0,0]},"f":{"1":0},"fnMap":{"1":{"name":"(anonymous_1)","line":1,"loc":{"start":{"line":1,"column":21},"end":{"line":1,"column":33}}}},"statementMap":{"1":{"start":{"line":1,"column":0},"end":{"line":24,"column":4}},"2":{"start":{"line":2,"column":2},"end":{"line":16,"column":51}},"3":{"start":{"line":18,"column":2},"end":{"line":20,"column":3}},"4":{"start":{"line":19,"column":4},"end":{"line":19,"column":26}},"5":{"start":{"line":22,"column":2},"end":{"line":22,"column":27}},"6":{"start":{"line":23,"column":2},"end":{"line":23,"column":39}}},"branchMap":{"1":{"line":16,"type":"binary-expr","locations":[{"start":{"line":16,"column":17},"end":{"line":16,"column":28}},{"start":{"line":16,"column":33},"end":{"line":16,"column":49}}]},"2":{"line":18,"type":"if","locations":[{"start":{"line":18,"column":2},"end":{"line":18,"column":2}},{"start":{"line":18,"column":2},"end":{"line":18,"column":2}}]},"3":{"line":18,"type":"binary-expr","locations":[{"start":{"line":18,"column":6},"end":{"line":18,"column":20}},{"start":{"line":18,"column":24},"end":{"line":18,"column":52}}]}}};
}
__cov_MFGraHnOZpFWrd0GJ15vEw = __cov_MFGraHnOZpFWrd0GJ15vEw['c:\\wamp64\\www\\svelte-heatmap\\src\\main.js'];
__cov_MFGraHnOZpFWrd0GJ15vEw.s['1']++;var cov_2o5l1vpegk=function(){__cov_MFGraHnOZpFWrd0GJ15vEw.f['1']++;__cov_MFGraHnOZpFWrd0GJ15vEw.s['2']++;var path='c:\\wamp64\\www\\svelte-heatmap\\src\\main.js',hash='dbaf1bde8951d5c09fb9f5d99570f1791e163b0c',global=new Function('return this')(),gcv='__coverage__',coverageData={path:'c:\\wamp64\\www\\svelte-heatmap\\src\\main.js',statementMap:{},fnMap:{},branchMap:{},s:{},f:{},b:{},_coverageSchema:'332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'},coverage=(__cov_MFGraHnOZpFWrd0GJ15vEw.b['1'][0]++, global[gcv])||(__cov_MFGraHnOZpFWrd0GJ15vEw.b['1'][1]++, global[gcv]={});__cov_MFGraHnOZpFWrd0GJ15vEw.s['3']++;if((__cov_MFGraHnOZpFWrd0GJ15vEw.b['3'][0]++, coverage[path])&&(__cov_MFGraHnOZpFWrd0GJ15vEw.b['3'][1]++, coverage[path].hash===hash)){__cov_MFGraHnOZpFWrd0GJ15vEw.b['2'][0]++;__cov_MFGraHnOZpFWrd0GJ15vEw.s['4']++;return coverage[path];}else{__cov_MFGraHnOZpFWrd0GJ15vEw.b['2'][1]++;}__cov_MFGraHnOZpFWrd0GJ15vEw.s['5']++;coverageData.hash=hash;__cov_MFGraHnOZpFWrd0GJ15vEw.s['6']++;return coverage[path]=coverageData;}();

return Heatmap$1;

})));
