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

function detachBetween(before, after) {
	while (before.nextSibling && before.nextSibling !== after) {
		before.parentNode.removeChild(before.nextSibling);
	}
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

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
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

// log a warning to the console
function warn(msg) {
    console.warn('[SvelteHeatmap] ' + msg);
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};























































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// for now these are just hard coded. in the future, this
// component should accept props to calculate these.
var colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];

var emptyColor = '#ebedf0';

// determine what color a day is
function attachDayColor(normalizedHistory) {
    var max = Math.max.apply(Math, toConsumableArray(normalizedHistory.map(function (day) {
        return day.value;
    })));

    var colorValues = colors.map(function (color, i) {
        return { color: color, value: i / colors.length };
    });

    return normalizedHistory.map(function (day) {
        var color = emptyColor;
        var dayValue = day.value / max;

        if (day.value) {
            for (var i = 0, end = colorValues.length; i < end; i++) {
                if (dayValue < colorValues[i].value) {
                    break;
                }

                color = colorValues[i].color;
            }
        }

        return {
            color: color,
            date: day.date,
            day: day.day,
            value: day.value
        };
    });
}

// group our normalized history by week
function groupWeeks(normalizedHist) {
    return normalizedHist.reduce(function (weeks, current) {
        // start a new week for the first data point and sundays
        if (!weeks.length || !current.day) {
            weeks.push([]);
        }

        // fill any missing days from the first week
        if (weeks.length === 1 && weeks[0].length === 0) {
            for (var i = 0; i < current.day; i++) {
                weeks[0].push(null);
            }
        }

        // and push the current data onto the last week
        weeks[weeks.length - 1].push(current);

        return weeks;
    }, []);
}

// normalize the history data. this includes sorting entries
// from oldest to newest, and filling in gaps between days.
function normalize(hist) {
    var normalizedHistory = hist.slice(0).sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
    }).reduce(fillMissingDates, []).map(attachDayOfWeek);

    // finally, attach a color to each piece of history
    return attachDayColor(normalizedHistory);
}

// validate that the history prop is in the correct format
function validate(hist) {
    // make sure history is present
    if (typeof hist === 'undefined') {
        throw 'Missing required "history" prop.';
    }

    // make sure the history is an array
    if (!Array.isArray(hist)) {
        throw 'History must be an array.';
    }

    // make sure each item in the history is valid
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = hist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;


            // items must be objects
            if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) !== 'object' || Array.isArray(item)) {
                throw 'All history items must be objects with "date" and "value" properties.';
            }

            // items must have valid dates
            if (typeof item.date !== 'string' || !item.date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                throw 'Invalid history date. Expected YYYY/MM/DD string, got ' + item.date + '.';
            }

            // items must have a valid value
            if (typeof item.value !== 'number' || item.value < 0 || item.value === Infinity) {
                throw 'Invalid history value. Expected positive number, got ' + item.value + '.';
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}

// reduce function to fill the gaps between history entries
function fillMissingDates(arr, current, i, history) {
    // add the current entry to the history
    arr.push(current);

    // fill in any gaps between the current and next entry
    var next = history[i + 1];

    if (next) {
        var tomorrow = new Date(current.date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        while (getDateString(tomorrow) < next.date) {
            arr.push({ date: getDateString(tomorrow), value: 0 });
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
    }

    return arr;
}

// identify each history entry with the day of the week
function attachDayOfWeek(_ref) {
    var date = _ref.date,
        value = _ref.value;

    var day = new Date(date).getDay();
    return { date: date, day: day, value: value };
}

// convert a Date object to a YYYY/MM/DD string
function getDateString(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '/');
}

/* src\heatmap.html generated by Svelte v1.41.3 */
function normalizedHistory(history) {
	return normalize(history || []);
}

function oncreate() {
    try {
        // validate the history prop
        validate(this.get('history'));

        // validate the tooltip prop
        const tooltip = this.get('tooltip');

        if (typeof tooltip !== 'undefined' && typeof tooltip !== 'function') {
            throw 'Invalid configuration, tooltip must be a function.';
        }
    } catch (err) {
        warn(err);
    }
}

function encapsulateStyles(node) {
	setAttribute(node, "svelte-2137778287", "");
}

function create_main_fragment(state, component) {
	var div, div_1;

	var each_value = groupWeeks(state.normalizedHistory);

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(state, each_value, each_value[i], i, component);
	}

	return {
		c: function create() {
			div = createElement("div");
			div_1 = createElement("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(div);
			div.className = "svelte-heatmap";
			div_1.className = "svelte-heatmap-inner";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(div_1, div);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div_1, null);
			}
		},

		p: function update(changed, state) {
			var each_value = groupWeeks(state.normalizedHistory);

			if (changed.normalizedHistory || changed.tooltip) {
				for (var i = 0; i < each_value.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].p(changed, state, each_value, each_value[i], i);
					} else {
						each_blocks[i] = create_each_block(state, each_value, each_value[i], i, component);
						each_blocks[i].c();
						each_blocks[i].m(div_1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = each_value.length;
			}
		},

		u: function unmount() {
			detachNode(div);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].u();
			}
		},

		d: function destroy$$1() {
			destroyEach(each_blocks);
		}
	};
}

// (4:8) {{#each groupWeeks(normalizedHistory) as week}}
function create_each_block(state, each_value, week, week_index, component) {
	var div;

	var week_1 = week;

	var each_blocks = [];

	for (var i = 0; i < week_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(state, each_value, week, week_index, week_1, week_1[i], i, component);
	}

	return {
		c: function create() {
			div = createElement("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			this.h();
		},

		h: function hydrate() {
			div.className = "svelte-heatmap-week";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},

		p: function update(changed, state, each_value, week, week_index) {
			var week_1 = week;

			if (changed.normalizedHistory || changed.tooltip) {
				for (var i = 0; i < week_1.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].p(changed, state, each_value, week, week_index, week_1, week_1[i], i);
					} else {
						each_blocks[i] = create_each_block_1(state, each_value, week, week_index, week_1, week_1[i], i, component);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = week_1.length;
			}
		},

		u: function unmount() {
			detachNode(div);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].u();
			}
		},

		d: function destroy$$1() {
			destroyEach(each_blocks);
		}
	};
}

// (8:16) {{#each week as day}}
function create_each_block_1(state, each_value, week, week_index, week_1, day, day_index, component) {
	var div;

	var if_block = (day !== null) && create_if_block(state, each_value, week, week_index, week_1, day, day_index, component);

	return {
		c: function create() {
			div = createElement("div");
			if (if_block) if_block.c();
			this.h();
		},

		h: function hydrate() {
			div.className = "svelte-heatmap-day";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			if (if_block) if_block.m(div, null);
		},

		p: function update(changed, state, each_value, week, week_index, week_1, day, day_index) {
			if (day !== null) {
				if (if_block) {
					if_block.p(changed, state, each_value, week, week_index, week_1, day, day_index);
				} else {
					if_block = create_if_block(state, each_value, week, week_index, week_1, day, day_index, component);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.u();
				if_block.d();
				if_block = null;
			}
		},

		u: function unmount() {
			detachNode(div);
			if (if_block) if_block.u();
		},

		d: function destroy$$1() {
			if (if_block) if_block.d();
		}
	};
}

// (15:36) {{#if typeof tooltip === 'function'}}
function create_if_block_1(state, each_value, week, week_index, week_1, day, day_index, component) {
	var raw_value = state.tooltip(day.date, day.value), raw_before, raw_after;

	return {
		c: function create() {
			raw_before = createElement('noscript');
			raw_after = createElement('noscript');
		},

		m: function mount(target, anchor) {
			insertNode(raw_before, target, anchor);
			raw_before.insertAdjacentHTML("afterend", raw_value);
			insertNode(raw_after, target, anchor);
		},

		p: function update(changed, state, each_value, week, week_index, week_1, day, day_index) {
			if ((changed.tooltip || changed.normalizedHistory) && raw_value !== (raw_value = state.tooltip(day.date, day.value))) {
				detachBetween(raw_before, raw_after);
				raw_before.insertAdjacentHTML("afterend", raw_value);
			}
		},

		u: function unmount() {
			detachBetween(raw_before, raw_after);

			detachNode(raw_before);
			detachNode(raw_after);
		},

		d: noop
	};
}

// (17:36) {{else}}
function create_if_block_2(state, each_value, week, week_index, week_1, day, day_index, component) {
	var text_value = day.value, text, text_1, text_2_value = day.date, text_2;

	return {
		c: function create() {
			text = createText(text_value);
			text_1 = createText(" on ");
			text_2 = createText(text_2_value);
		},

		m: function mount(target, anchor) {
			insertNode(text, target, anchor);
			insertNode(text_1, target, anchor);
			insertNode(text_2, target, anchor);
		},

		p: function update(changed, state, each_value, week, week_index, week_1, day, day_index) {
			if ((changed.normalizedHistory) && text_value !== (text_value = day.value)) {
				text.data = text_value;
			}

			if ((changed.normalizedHistory) && text_2_value !== (text_2_value = day.date)) {
				text_2.data = text_2_value;
			}
		},

		u: function unmount() {
			detachNode(text);
			detachNode(text_1);
			detachNode(text_2);
		},

		d: noop
	};
}

// (12:24) {{#if day !== null}}
function create_if_block(state, each_value, week, week_index, week_1, day, day_index, component) {
	var div, div_1;

	var current_block_type = select_block_type(state, each_value, week, week_index, week_1, day, day_index);
	var if_block = current_block_type(state, each_value, week, week_index, week_1, day, day_index, component);

	return {
		c: function create() {
			div = createElement("div");
			div_1 = createElement("div");
			if_block.c();
			this.h();
		},

		h: function hydrate() {
			div.className = "svelte-heatmap-day-inner";
			setStyle(div, "background-color", day.color);
			div_1.className = "svelte-heatmap-day-tooltip";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(div_1, div);
			if_block.m(div_1, null);
		},

		p: function update(changed, state, each_value, week, week_index, week_1, day, day_index) {
			if (changed.normalizedHistory) {
				setStyle(div, "background-color", day.color);
			}

			if (current_block_type === (current_block_type = select_block_type(state, each_value, week, week_index, week_1, day, day_index)) && if_block) {
				if_block.p(changed, state, each_value, week, week_index, week_1, day, day_index);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(state, each_value, week, week_index, week_1, day, day_index, component);
				if_block.c();
				if_block.m(div_1, null);
			}
		},

		u: function unmount() {
			detachNode(div);
			if_block.u();
		},

		d: function destroy$$1() {
			if_block.d();
		}
	};
}

function select_block_type(state, each_value, week, week_index, week_1, day, day_index) {
	if (typeof state.tooltip === 'function') return create_if_block_1;
	return create_if_block_2;
}

function Heatmap$1(options) {
	init(this, options);
	this._state = assign({}, options.data);
	this._recompute({ history: 1 }, this._state);

	var _oncreate = oncreate.bind(this);

	if (!options._root) {
		this._oncreate = [_oncreate];
	} else {
	 	this._root._oncreate.push(_oncreate);
	 }

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);

		callAll(this._oncreate);
	}
}

assign(Heatmap$1.prototype, proto);

Heatmap$1.prototype._recompute = function _recompute(changed, state) {
	if (changed.history) {
		if (differs(state.normalizedHistory, (state.normalizedHistory = normalizedHistory(state.history)))) changed.normalizedHistory = true;
	}
};

return Heatmap$1;

})));
